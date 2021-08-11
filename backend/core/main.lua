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

ENV_PRODUCTION = 1
ENV_DEVELOPMENT = 2
ENV_TESTING = 3
ENV_STAGING = 4

local function init_environment()
	local envtbl = {
		production = ENV_PRODUCTION,
		development = ENV_DEVELOPMENT,
		testing = ENV_TESTING,
		staging = ENV_STAGING,
	}
	local str = os.getenv("ENVIRONMENT"):lower()
	ENVIRONMENT = envtbl[str]
	if not ENVIRONMENT then
		error("Invalid environment")
	end
	ENVIRONMENT_STRING = str
end
init_environment()

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

local loadfile = loadfile
function dofile(file)
	loadfile(file)()
end

dofile("/var/www/foxcaves/" .. ENVIRONMENT_STRING .. ".lua")
SHORT_URL = CONFIG.urls.short
MAIN_URL = CONFIG.urls.main

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
