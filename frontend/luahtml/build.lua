local lfs = require("lfs")
local eval_template = dofile("template.lua")

print("Building...")

dofile("template.lua")

local DISTDIR = arg[1]

local function store_template(name)
    local template = eval_template(name)

    if template:sub(1, 1) == " " then
        template = template:sub(2)
    end
    local len = template:len()
    if template:sub(len, 1) == " " then
        template = template:sub(1, len - 1)
    end

    local fh = io.open(DISTDIR .. "/" .. name, "w")
    fh:write(template)
    fh:close()
end

os.execute("mkdir -p '" .. DISTDIR .. "'")

local function scan_template_dir_int(dir, basedirlen)
    for file in lfs.dir(dir) do
        local first = file:sub(1, 1)
        if first ~= "." and first ~= "_" then
            local absfile = dir .. "/" .. file
            local attributes = lfs.attributes(absfile)
            local relfile = absfile:sub(basedirlen)
            if attributes.mode == "file" then
                store_template(relfile)
            elseif attributes.mode == "directory" then
                os.execute("mkdir '" .. DISTDIR .. "/" .. relfile .. "'")
                scan_template_dir_int(absfile, basedirlen)
            end
        end
    end
end
local function scan_template_dir(dir)
    scan_template_dir_int(dir, dir:len() + 2)
end
scan_template_dir("templates")

print("Done!")
