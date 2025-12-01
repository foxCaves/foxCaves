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
          luarocks = "${pkgs.luarocks}/bin/luarocks";
          luarocksPackages = [
            "lua-resty-acme"
            "lua-resty-uuid"
            "lua-resty-mysql"
            "lpath"
          ];
          opm = null; # TODO: Get OPM maybe
          opmPackages = [
            "openresty/lua-resty-redis"
            "openresty/lua-resty-websocket"
            "thibaultcha/lua-argon2-ffi"
            "GUI/lua-resty-mail"
            "openresty/lua-resty-string"
            "jkeys089/lua-resty-hmac"
            "ledgetech/lua-resty-http"
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
