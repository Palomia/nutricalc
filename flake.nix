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

          default = self.packages.${system}.poc;
        }
      );

      # L'app web se construit avec pnpm dans le devShell (pas via un
      # fixed-output derivation Nix) : le sandbox Nix n'a pas le CA du proxy
      # d'entreprise et ne peut pas joindre le registre npm. Le devShell, lui,
      # hérite de la confiance CA du shell.  Voir DESIGN.md, section « Tech ».
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
