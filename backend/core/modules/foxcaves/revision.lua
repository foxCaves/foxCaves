local function load_revision()
	local fh = io.open("../.revision", "r")
	if not fh then
		return
	end
	local rev = fh:read("*all"):gsub("%s+", "")
	fh:close()
    return {
        hash = rev
    }
end

return load_revision()
