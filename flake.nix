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

          # The deployed site. Its deps come from a fixed-output derivation,
          # which inherits the proxy vars and NIX_SSL_CERT_FILE from the caller.
          web = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "nutricalc-web";
            version = "0.0.0";
            src = ./.;

            nativeBuildInputs = [
              pkgs.nodejs
              pkgs.pnpm
              pkgs.pnpmConfigHook
            ];

            # fetcherVersion 4 is required by pnpm >= 11. Regenerate the hash
            # when deps change; the build prints the expected value.
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

      # Static site deployment: Caddy serves the built dist. The domain is a
      # consumer option so the project isn't bound to any one host.
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
