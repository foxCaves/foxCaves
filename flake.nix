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
        luaGitModules = [
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
            rev = "v1.0.4";
            hash = "sha256-c1hvBfxbIyVEK+8x3SCouTrUhU+5HQW8yC8/Dfa+/Js=";
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
            owner = "fffonion";
            repo = "lua-resty-openssl";
            name = repo;
            rev = "1.7.0";
            hash = "sha256-xcEnic0aQCgzIlgU/Z6dxH7WTyTK+g5UKo4BiKcvNxQ=";
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
          nodejs = pkgs.nodejs_24;
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

        luaGitPkg = pkgs.stdenv.mkDerivation {
          name = "foxcaves-lua-git";
          version = "1.0.0";

          inherit luaGitModules;

          buildInputs = with pkgs; [
            stdenv.cc.cc
            luajit
            gd
            pkg-config
          ];

          nativeBuildInputs = with pkgs; [
            autoPatchelfHook
          ];

          unpackPhase = ''
            mkdir -p ./r/lib ./r/share
            for pkg in $luaGitModules; do
              rm -rf ./tmp && mkdir ./tmp
              cp -r "$pkg"/* ./tmp
              find ./tmp -type d -exec chmod 755 {} +
              if [ -f ./tmp/Makefile ]; then
                fileCount="$(find ./tmp -type f '(' -iname '*.c' -o -iname '*.cpp' ')' | wc -l)"
                if [ "$fileCount" -eq 0 ]; then
                  echo "No native code files found in $pkg, skipping build"
                else
                  echo "Building Lua module in $pkg"
                  cd ./tmp
                  LUA_INCDIR=${pkgs.luajit}/include make
                  cd ..
                  cp ./tmp/*.so ./r/lib
                fi
              fi
              if [ -d ./tmp/lib ]; then
                cp -r ./tmp/lib/* ./r/share
              elif [ -d ./tmp/src ]; then
                cp -r ./tmp/src/* ./r/share
              else
                find ./tmp/* -maxdepth 1 -type d -print -exec cp -r '{}' ./r/share/ \;
              fi
            done
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
              luaCPath = lib.concatStringsSep ";" (
                (map (pkg: "${pkg}/lib/lua/5.1/?.so") luaModules) ++ [ "${luaGitPkg}/lib/?.so" ]
              );
              luaPath = lib.concatStringsSep ";" (
                lib.flatten (
                  (map (pkg: [
                    "${pkg}/share/lua/5.1/?.lua"
                    "${pkg}/share/lua/5.1/?/init.lua"
                  ]) luaModules)
                )
                ++ [
                  "${luaGitPkg}/share/?.lua"
                  "${luaGitPkg}/share/?/init.lua"
                ]
              );
              envFile = ''
                export FCV_FRONTEND_ROOT='${frontend}/lib/node_modules/foxcaves-frontend/build'
                export FCV_LUA_ROOT='${backend}/share/foxcaves/lua'
                export FCV_NGINX_TEMPLATE_ROOT='${backend}/etc/nginx'
                export FCV_NGINX='${pkgs.openresty}'
                export FCV_LUAJIT='${pkgs.luajit}'
                export FCV_OPENSSL='${pkgs.openssl}'
                export FCV_CACERT='${pkgs.cacert}'
                export CAPTCHA_FONT="${pkgs.dejavu_fonts}/share/fonts/truetype/DejaVuSans.ttf"
                export LUA_CPATH='${luaCPath}'
                export LUA_PATH='${luaPath}'
                export PATH="$PATH:${pkgs.coreutils}/bin:${pkgs.gnugrep}/bin:${pkgs.findutils}/bin"
                export LD_LIBRARY_PATH="${pkgs.libargon2}/lib"
                export GIT_REVISION='${self.rev or "${self.dirtyRev}-dirt"}'
              '';
            in
            ''
              mkdir -p ./r/share/foxcaves ./r/bin
              cp -r ${./bin}/* ./r/bin/
              cp ${pkgs.writeText "foxcaves-env" envFile} ./r/bin/foxcaves-env
            '';

          installPhase = ''
            mkdir -p $out
            cp -r r/* $out/
          '';
        };
      in
      {
        packages.foxcaves-frontend = frontend;
        packages.foxcaves-docker = pkgs.dockerTools.buildImage {
          name = "git.foxden.network/foxcaves/foxcaves";
          tag = "latest";
          config = {
            Entrypoint = [ "${main}/bin/foxcaves" ];
          };
        };
        packages.foxcaves = main;
        packages.default = main;
      }
    );
}
