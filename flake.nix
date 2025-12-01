{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        frontend = pkgs.buildNpmPackage {
          pname = "foxcaves-frontend";
          version = "1.0.0";
          src = ./frontend;
          npmDeps = pkgs.importNpmLock { npmRoot = ./frontend; };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;
        };

        backend = pkgs.stdenv.mkDerivation {
          name = "foxcaves-backend";
          version = "1.0.0";
          src = ./backend;

          luaModules = with pkgs.luajitPackages; [
            luasocket
            luafilesystem
            luaossl
          ];

          luaGitPackages = [
            (pkgs.fetchFromGitHub {
              owner = "foxCaves";
              repo = "lua-gd";
              rev = "v3.0.0";
              hash = "sha256-JdM+cbe+PKwsG6Fr/CiWz2EC8HK7HOwqQgL2v0y9qQc=";
            })
            (pkgs.fetchFromGitHub {
              owner = "foxCaves";
              repo = "raven-lua";
              rev = "v1.0.3";
              hash = "sha256-EhLbvb8dK/K2DcPWdjZYG0U2g+EYQRszRoOVTorB7xE=";
            })
            (pkgs.fetchFromGitHub {
              owner = "foxCaves";
              repo = "lua-resty-cookie";
              rev = "v0.1.8";
              hash = "sha256-CzHf0kgutb0aOjut2UzJ1u07bCP/ep55AQN9Gj5CK0M=";
            })
            (pkgs.fetchFromGitHub {
              owner = "foxCaves";
              repo = "lua-resty-aws-signature";
              rev = "v0.3.1";
              hash = "sha256-z7uqj6HXqQYkIfhduFk+loHTTqD+LQtoFooc6s7H4gE=";
            })
            (pkgs.fetchFromGitHub {
              owner = "spacewander";
              repo = "lua-resty-base-encoding";
              rev = "1.3.0";
              hash = "sha256-7L3EGhSMOAwxMJab2ZEkYL4T8bLztwWCKyhnEmGOLMo=";
            })
            (pkgs.fetchFromGitHub {
              owner = "fffonion";
              repo = "lua-resty-acme";
              rev = "0.16.0";
              hash = "sha256-aiZxcgIccAuGALh2uXalA0CwWyBGEOMda0ANaBncHSQ=";
            })
            (pkgs.fetchFromGitHub {
              owner = "openresty";
              repo = "lua-resty-mysql";
              rev = "v0.28";
              hash = "sha256-gunxl3JIDtqxAw5m3unKH6v+4W4/YV9noBAvwU1vFTM=";
            })
            (pkgs.fetchFromGitHub {
              owner = "openresty";
              repo = "lua-resty-redis";
              rev = "v0.33";
              hash = "sha256-2ZF1o7Cx1UxqRQ3k8RJPIdtS92oYR8aJWOkcEpF2Zv0=";
            })
            (pkgs.fetchFromGitHub {
              owner = "openresty";
              repo = "lua-resty-websocket";
              rev = "v0.13";
              hash = "sha256-DuSQcNM+semoOMX3JRMyE6+xo00kx8ln6L83OxzTYpU=";
            })
            (pkgs.fetchFromGitHub {
              owner = "openresty";
              repo = "lua-resty-string";
              rev = "v0.16";
              hash = "sha256-omAjZhu3NH6Wcz8e4pGYMRLKAz826dNa3IwgPoX4DGU=";
            })
            (pkgs.fetchFromGitHub {
              owner = "thibaultCha";
              repo = "lua-resty-jit-uuid";
              rev = "0.0.7";
              hash = "sha256-C7JkmHnW+SO3g8a2VDZwK2frKRV4iJrXKjxN1diTKP4=";
            })
            (pkgs.fetchFromGitHub {
              owner = "thibaultCha";
              repo = "lua-argon2-ffi";
              rev = "3.0.1";
              hash = "sha256-R5q1eqY9a7dgLSpgApgy3DSMGzEgHFdQRNcLJ2HXvqU=";
            })
            (pkgs.fetchFromGitHub {
              owner = "starwing";
              repo = "lpath";
              rev = "0.4.0";
              hash = "sha256-1C0HlIGpag2EInGp+Z2DeK5s0xjp6/WExkLSUVDtsig=";
            })
            (pkgs.fetchFromGitHub {
              owner = "GUI";
              repo = "lua-resty-mail";
              rev = "v1.1.0";
              hash = "sha256-Zb77OC52NsPqqpOdanc3p+IUjNCD76H7SqvmXkWNdmQ=";
            })
            (pkgs.fetchFromGitHub {
              owner = "jkeys089";
              repo = "lua-resty-hmac";
              rev = "0.06-1";
              hash = "sha256-CdYps8gqJqa0UzvZ8CsesEyBIb3rr0ZD+ugCr5P96NM=";
            })
            (pkgs.fetchFromGitHub {
              owner = "ledgetech";
              repo = "lua-resty-http";
              rev = "v0.17.2";
              hash = "sha256-Ph3PpzQYKYMvPvjYwx4TeZ9RYoryMsO6mLpkAq/qlHY=";
            })
          ];

          unpackPhase = ''

          '';

          installPhase = ''

          '';
        };
      in
      {
        packages.frontend = frontend;
        packages.backend = backend;
      }
    );
}
