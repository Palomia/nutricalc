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
          # The Python proof-of-concept. Building it runs the test suite, so
          # `nix build` (and CI) fails on a red suite — same contract as the
          # web app will get later.
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
              # Provisioned ahead of the web phase (React + Vite + Tailwind).
              pkgs.nodejs
              pkgs.pnpm
            ];
          };
        }
      );
    };
}
