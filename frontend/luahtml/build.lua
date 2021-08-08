print("Building...")
dofile("template.lua")

local DISTDIR = "../dist"

local function storeTemplate(name, maintitle)
    local params = {
        MAINTITLE = maintitle,
    }
    local template = evalTemplate(name, params)
    local fh = io.open(DISTDIR .. "/" .. name .. ".html", "w")
    fh:write(template)
    fh:close()
end

os.execute("mkdir -p '" .. DISTDIR .. "'")
os.execute("mkdir '" .. DISTDIR .. "/legal'")
os.execute("mkdir '" .. DISTDIR .. "/email'")

storeTemplate("email/activation", "Activation E-Mail")
storeTemplate("email/forgotpwd", "Forgot password")
storeTemplate("email/code", "E-Mail code check", "email/code")
storeTemplate("index", "Home")
storeTemplate("legal/terms_of_service", "Terms of Service")
storeTemplate("legal/privacy_policy", "Privacy policy")
storeTemplate("live", "Live drawing")
storeTemplate("login", "Login")
storeTemplate("myaccount", "My account")
storeTemplate("myfiles", "My files")
storeTemplate("mylinks", "My links")
storeTemplate("register", "Register")
storeTemplate("view", "View file")

print("Done!")
