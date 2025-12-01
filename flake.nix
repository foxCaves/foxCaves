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
        lib = nixpkgs.lib;
        pkgs = nixpkgs.legacyPackages.${system};

        luaModules = with pkgs.luajitPackages; [
          luasocket
          luafilesystem
          luaossl
          cjson
        ];
        luaGitPackages = [
          (pkgs.fetchFromGitHub rec {
            owner = "foxCaves";
            repo = "lua-gd";
            name = repo;
            rev = "v3.0.0";
            hash = "sha256-JdM+cbe+PKwsG6Fr/CiWz2EC8HK7HOwqQgL2v0y9qQc=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "foxCaves";
            repo = "raven-lua";
            name = repo;
            rev = "v1.0.3";
            hash = "sha256-EhLbvb8dK/K2DcPWdjZYG0U2g+EYQRszRoOVTorB7xE=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "foxCaves";
            repo = "lua-resty-cookie";
            name = repo;
            rev = "v0.1.8";
            hash = "sha256-CzHf0kgutb0aOjut2UzJ1u07bCP/ep55AQN9Gj5CK0M=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "foxCaves";
            repo = "lua-resty-aws-signature";
            name = repo;
            rev = "v0.3.1";
            hash = "sha256-z7uqj6HXqQYkIfhduFk+loHTTqD+LQtoFooc6s7H4gE=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "spacewander";
            repo = "lua-resty-base-encoding";
            name = repo;
            rev = "1.3.0";
            hash = "sha256-7L3EGhSMOAwxMJab2ZEkYL4T8bLztwWCKyhnEmGOLMo=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "fffonion";
            repo = "lua-resty-acme";
            name = repo;
            rev = "0.16.0";
            hash = "sha256-aiZxcgIccAuGALh2uXalA0CwWyBGEOMda0ANaBncHSQ=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "openresty";
            repo = "lua-resty-mysql";
            name = repo;
            rev = "v0.28";
            hash = "sha256-gunxl3JIDtqxAw5m3unKH6v+4W4/YV9noBAvwU1vFTM=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "openresty";
            repo = "lua-resty-redis";
            name = repo;
            rev = "v0.33";
            hash = "sha256-2ZF1o7Cx1UxqRQ3k8RJPIdtS92oYR8aJWOkcEpF2Zv0=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "openresty";
            repo = "lua-resty-websocket";
            name = repo;
            rev = "v0.13";
            hash = "sha256-DuSQcNM+semoOMX3JRMyE6+xo00kx8ln6L83OxzTYpU=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "openresty";
            repo = "lua-resty-string";
            name = repo;
            rev = "v0.16";
            hash = "sha256-omAjZhu3NH6Wcz8e4pGYMRLKAz826dNa3IwgPoX4DGU=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "thibaultCha";
            repo = "lua-resty-jit-uuid";
            name = repo;
            rev = "0.0.7";
            hash = "sha256-C7JkmHnW+SO3g8a2VDZwK2frKRV4iJrXKjxN1diTKP4=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "thibaultCha";
            repo = "lua-argon2-ffi";
            name = repo;
            rev = "3.0.1";
            hash = "sha256-R5q1eqY9a7dgLSpgApgy3DSMGzEgHFdQRNcLJ2HXvqU=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "GUI";
            repo = "lua-resty-mail";
            name = repo;
            rev = "v1.1.0";
            hash = "sha256-Zb77OC52NsPqqpOdanc3p+IUjNCD76H7SqvmXkWNdmQ=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "jkeys089";
            repo = "lua-resty-hmac";
            name = repo;
            rev = "0.06-1";
            hash = "sha256-CdYps8gqJqa0UzvZ8CsesEyBIb3rr0ZD+ugCr5P96NM=";
          })
          (pkgs.fetchFromGitHub rec {
            owner = "ledgetech";
            repo = "lua-resty-http";
            name = repo;
            rev = "v0.17.2";
            hash = "sha256-Ph3PpzQYKYMvPvjYwx4TeZ9RYoryMsO6mLpkAq/qlHY=";
          })
        ];

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

          unpackPhase = ''
            mkdir -p ./r/share/foxcaves ./r/etc
            cp -r ${./backend} ./r/share/foxcaves/lua
            cp -r ${./config} ./r/etc/foxcaves
            cp -r ${./nginx} ./r/etc/nginx
          '';

          installPhase = ''
            mkdir -p $out
            cp -r r/* $out/
          '';
        };

        main = pkgs.stdenv.mkDerivation {
          name = "foxcaves-main";
          version = "1.0.0";

          unpackPhase =
            let
              luaCPath = lib.concatStringsSep ";" (map (pkg: "${pkg}/lib/lua/5.1/?.so") luaModules);
              luaPath = lib.concatStringsSep ";" (
                (map (pkg: "${pkg}/share/lua/5.1/?.lua") luaModules)
                ++ (map (pkg: "${pkg}/share/lua/5.1/?/init.lua") luaModules)
                ++ (map (pkg: "${pkg}/lib/?.lua") luaGitPackages)
              );
              envFile = ''
                export FRONTEND_ROOT='${frontend}/lib/node_modules/foxcaves-frontend/build'
                export LUA_ROOT='${backend}/share/foxcaves/lua'
                export NGINX_TEMPLATE_ROOT='${backend}/etc/nginx'
                export OPENRESTY='${pkgs.luajit_openresty}'
                export LUAJIT='${pkgs.luajit}'
                export LUA_CPATH='${luaCPath}'
                export LUA_PATH='${luaPath}'
                export PATH="$PATH:${pkgs.coreutils}/bin"
              '';
            in
            ''
              mkdir -p ./r/share/foxcaves
              cp -r ${./service}/* ./r
              cp ${pkgs.writeText "foxcaves-env.sh" envFile} ./r/share/foxcaves/env.sh
            '';

          installPhase = ''
            mkdir -p $out
            cp -r r/* $out/
          '';
        };
      in
      {
        packages.frontend = frontend;
        packages.backend = backend;
        packages.default = main;
      }
    );
}
