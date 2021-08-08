local lfs = require("lfs")

print("Building...")

dofile("template.lua")

local DISTDIR = "../dist"

local function storeTemplate(name)
    local params = {
        MAINTITLE = "TEST",
    }
    local template = evalTemplate(name, params)
    local fh = io.open(DISTDIR .. "/" .. name .. ".html", "w")
    fh:write(template)
    fh:close()
end

os.execute("mkdir -p '" .. DISTDIR .. "'")
os.execute("mkdir '" .. DISTDIR .. "/legal'")
os.execute("mkdir '" .. DISTDIR .. "/email'")

local function scanTemplateDir(dir)
    for file in lfs.dir(dir) do
        local first = file:sub(1, 1)
        if first ~= "." and first ~= "_" then
            local absfile = dir .. "/" .. file
            local attributes = lfs.attributes(absfile)
            if attributes.mode == "file" then
                storeTemplate(absfile)
            elseif attributes.mode == "directory" then
                scanTemplateDir(absfile)
            end
        end
    end
end
scanTemplateDir("templates")

print("Done!")
