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

local function scanTemplateDirInt(dir, ext, extlen, basedirlen)
    for file in lfs.dir(dir) do
        local first = file:sub(1, 1)
        if first ~= "." and first ~= "_" then
            local absfile = dir .. "/" .. file
            local attributes = lfs.attributes(absfile)
            if attributes.mode == "file" and file:sub(file:len() - (extlen - 1)) == ext then
                storeTemplate(absfile:sub(1, absfile:len() - extlen):sub(basedirlen))
            elseif attributes.mode == "directory" then
                scanTemplateDirInt(absfile, ext, extlen, basedirlen)
            end
        end
    end
end
local function scanTemplateDir(dir, ext)
    scanTemplateDirInt(dir, ext, ext:len(), dir:len() + 2)
end
scanTemplateDir("templates", ".tpl")

print("Done!")
