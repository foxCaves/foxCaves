ENVIRONMENT = os.getenv("ENVIRONMENT") or "development"
IS_PRODUCTION = (ENVIRONMENT == "production")

local function load_revision()
	local fh = io.open("/var/www/foxcaves/.revision", "r")
	if not fh then
		REVISION = "unknown"
		return
	end
	REVISION = fh:read("*all"):gsub("%s+", "")
	fh:close()
end
load_revision()

lfs = require("lfs")
cjson = require("cjson")
argon2 = require("argon2")

dofile("/var/www/foxcaves/config/main.lua")

MAIN_DIR = "/var/www/foxcaves/lua/"
lfs.chdir(MAIN_DIR)

function explode(div,str) -- credit: http://richard.warburton.it
	local pos, arr = 0, {}
	-- for each divider found
	for st, sp in function() return str:find(div,pos,true) end do
		table.insert(arr,str:sub(pos,st-1)) -- Attach chars left of current divider
		pos = sp + 1 -- Jump past current divider
	end
	table.insert(arr, str:sub(pos)) -- Attach chars right of last divider
	return arr
end

local setfenv = setfenv
local getfenv = getfenv
local filecache = {}
function loadfile_cached(file)
	local code = filecache[file]
	if not code then
		local fh = io.open(file, "r")
		if not fh then
			error("Could not open file: " .. file)
		end
		local data = fh:read("*all")
		fh:close()

		local err
		code, err = load("return function()\n"..data.."\nend", file)
		if err then
			error(err)
		end

		if IS_PRODUCTION then
			filecache[file] = code
		end
	end
	return code
end
local loadfile_cached = loadfile_cached
function dofile_cached(file)
	local code = loadfile_cached(file)
	return setfenv(code, getfenv())()
end

local loadfile = loadfile
function dofile(file)
	loadfile(file)()
end

function parse_authorization_header(auth)
	if not auth then
		return
	end
	if auth:sub(1, 6):lower() ~= "basic " then
		return
	end
	auth = ngx.decode_base64(auth:sub(7))
	if not auth or auth == "" then
		return
	end
	local colonPos = auth:find(":", 1, true)
	if not colonPos then
		return
	end
	return auth:sub(1, colonPos - 1), auth:sub(colonPos + 1)
end

local function scan_include_dir(dir)
    for file in lfs.dir(dir) do
        if file:sub(1, 1) ~= "." then
            local absfile = dir .. "/" .. file
            local attributes = lfs.attributes(absfile)
            if attributes.mode == "file" then
                loadfile(absfile)()
            elseif attributes.mode == "directory" then
                scan_include_dir(absfile)
            end
        end
    end
end
scan_include_dir("core/includes")

collectgarbage("collect")
