local preprocess_template

local function get_revision()
    local fh = io.open("../.revision", "r")
    if not fh then
        error("Missing .revision file!")
    end
    local ret = fh:read("*all")
    fh:close()
    return ret:gsub("%s+", "")
end
local revision = get_revision()

local function load_template_file(name, insideother)
    local file = io.open("templates/" .. name, "r")
    if not file then
        error("Could not open template: " .. name)
    end
    local code = file:read("*all")
    file:close()

    code = preprocess_template(code, insideother)

    return code
end

function preprocess_template(code, insideother)
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
                table.insert(concatTbl, load_template_file(match, true))
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

local function load_template(name)
    local code = load_template_file(name, false)
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

local function eval_template(name)
    local tpl = load_template(name)()
    if type(tpl) == "string" then
        return tpl
    end

    local params = {
        REVISION = revision,
        table = table,
    }

    return setfenv(tpl, params)()
end

return eval_template
