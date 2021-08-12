local preprocessTemplate

local function getRevision()
	local fh = io.open("../.revision", "r")
	if not fh then
		error("Missing .revision file!")
	end
	local ret = fh:read("*all")
	fh:close()
	return ret:gsub("%s+", "")
end
local revision = getRevision()

local function loadTemplateFile(name, insideother)
	local file = io.open("templates/" .. name, "r")
	if not file then
		error("Could not open template: " .. name)
	end
	local code = file:read("*all")
	file:close()

	code = preprocessTemplate(code, insideother)

	code = code:gsub("<!--(.-)-->", "")
	code = code:gsub("%s%s+", " ")
	--code = code:gsub("^[\r\n\t ]+", "")
	--code = code:gsub("[\r\n\t ]+$", "")

	return code
end

function preprocessTemplate(code, insideother)
	local startPos
	local endPos = 0
	local match
	local marker
	local lastCut = 1
	local concatTbl
	if insideother then
		concatTbl = {}
	else
		concatTbl = {"return function() local retTbl = {}"}
	end

	while true do
		startPos, endPos, marker, match = string.find(code, "<%%([=+#]) +(.-) +%%>", endPos+1)
		if not startPos then
			break
		end

		local codeBlock = code:sub(lastCut, startPos-1)
		if codeBlock ~= "" then
			table.insert(concatTbl, "table.insert(retTbl, [["..codeBlock.."]])")
		end

		if match ~= "" then
			if marker == "=" then
				table.insert(concatTbl, "table.insert(retTbl, "..match..")")
			elseif marker == "+" then
				table.insert(concatTbl, loadTemplateFile(match, true))
			elseif marker == "#" then
				table.insert(concatTbl, match)
			end
		end
		lastCut = endPos+1
	end
	if lastCut == 1 and not insideother then
		return "return [["..code.."]]"
	end

	local codeBlock = code:sub(lastCut, code:len())
	if codeBlock ~= "" then
		table.insert(concatTbl, "table.insert(retTbl, [["..codeBlock.."]])")
	end
	if not insideother then
		table.insert(concatTbl, "return table.concat(retTbl) end")
	end
	return table.concat(concatTbl, "\n")
end

local function loadTemplate(name)
	local code = loadTemplateFile(name, false)
	local func, err = load(code, "TEMPLATE:"..name)
	if not func then
		error(
			string.format(
				"Failed to compile template %s : %s",
				name,
				err
			)
		)
	end
	return func
end

function evalTemplate(name)
	local tpl = loadTemplate(name)()
	if type(tpl) == "string" then
		return tpl
	end

	local params = {
		REVISION = revision,
		table = table,
	}

	return setfenv(tpl, params)()
end
