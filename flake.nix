{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];

      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          python = pkgs.python3.withPackages (ps: [ ps.pytest ]);
        in
        {
          # POC Python. Le build lance pytest via doCheck : CI rouge si la
          # suite échoue. (Le POC ne dépend que de la stdlib, donc il se
          # construit sans accès réseau dans le sandbox Nix.)
          poc = pkgs.stdenv.mkDerivation {
            pname = "nutricalc-poc";
            version = "0.0.0";
            src = ./poc;

            nativeBuildInputs = [ python ];

            doCheck = true;
            dontConfigure = true;
            buildPhase = "true";
            checkPhase = "pytest -q";

            installPhase = ''
              mkdir -p $out
              cp -r nutricalc $out/
            '';
          };

          # Build de l'app web, servi tel quel par le module NixOS ci-dessous.
          # `fetchPnpmDeps` est une fixed-output derivation : elle a le réseau,
          # et transmet http(s)_proxy et NIX_SSL_CERT_FILE depuis l'appelant
          # (cf. lib.fetchers.proxyImpureEnvVars). Derrière le proxy
          # d'entreprise, pointer NIX_SSL_CERT_FILE sur un bundle contenant son
          # CA ; `nix build .#default` (le POC) n'a lui besoin d'aucun réseau.
          web = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "nutricalc-web";
            version = "0.0.0";
            src = ./.;

            nativeBuildInputs = [
              pkgs.nodejs
              pkgs.pnpm
              pkgs.pnpmConfigHook
            ];

            # `fetcherVersion = 4` est imposé par pnpm >= 11 (nixpkgs rejette
            # la 3). À regénérer quand les dépendances changent : le build
            # échoue alors en affichant le hash attendu.
            pnpmDeps = pkgs.fetchPnpmDeps {
              inherit (finalAttrs) pname version src;
              fetcherVersion = 4;
              hash = "sha256-uL+mH+0+B/td4iuZemG+iaSIqr4FHseBkgboBpYfXf8=";
            };

            doCheck = true;
            checkPhase = "pnpm test";
            buildPhase = "pnpm build";

            installPhase = ''
              cp -r dist $out
            '';
          });

          default = self.packages.${system}.poc;
        }
      );

      # Déploiement du site statique : Caddy sert le `dist` construit
      # ci-dessus. Le domaine est une option du consommateur, pour que le
      # projet ne soit lié à aucun hébergeur en particulier.
      nixosModules.default =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          inherit (pkgs.stdenv.hostPlatform) system;
          cfg = config.services.nutricalc;
        in
        {
          options.services.nutricalc = {
            enable = lib.mkEnableOption "the nutricalc static site";

            hostName = lib.mkOption {
              type = lib.types.str;
              example = "nutricalc.example.com";
              description = "Domain Caddy serves nutricalc on.";
            };
          };

          config = lib.mkIf cfg.enable {
            services.caddy = {
              enable = true;
              virtualHosts.${cfg.hostName}.extraConfig = /* caddy */ ''
                root * ${self.packages.${system}.web}
                encode zstd gzip
                file_server
              '';
            };
          };
        };

      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              (pkgs.python3.withPackages (ps: [ ps.pytest ]))
              pkgs.ruff
              pkgs.nodejs
              pkgs.pnpm
            ];
          };
        }
      );
    };
}
