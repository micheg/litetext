import React, { useState, useRef, useEffect } from "react";
import
    {
        Bold,
        Italic,
        List,
        AlignLeft,
        AlignCenter,
        AlignRight,
        AlignJustify,
        ListOrdered,
        Table,
        X,
        Minus,
    } from "lucide-react";

const RichTextEditor = ({ onContentChange, editorHeight = "300px" }) =>
{
    const editorRef = useRef(null);
    const [content, setContent] = useState("");
    const [showTableSelector, setShowTableSelector] = useState(false);
    const [activeStates, setActiveStates] = useState({
        bold: false,
        italic: false,
        unorderedList: false,
        orderedList: false,
        alignLeft: true,
        alignCenter: false,
        alignRight: false,
        alignJustify: false,
    });

    // Toggles text formatting based on the command provided (e.g., bold, italic)
    const toggleFormat = (command) =>
    {
        document.execCommand(command, false, null);
        editorRef.current?.focus();
    };

    // Handles input events to update the content and notify the parent component
    const handleInput = () =>
    {
        const newContent = editorRef.current.innerHTML;
        setContent(newContent);
        if (onContentChange)
        {
            onContentChange(newContent);
        }
    };

    // Inserts a horizontal rule (<hr>) at the cursor position
    const insertHR = () =>
    {
        document.execCommand("insertHorizontalRule");
        editorRef.current?.focus();
    };

    // Inserts a table with the specified rows and columns at the cursor position
    const insertTable = (rows, cols) =>
    {
        const editor = editorRef.current;
        if (!editor) return;

        let tableHTML = "<table><tbody>";
        for (let i = 0; i < rows; i++)
        {
            tableHTML += "<tr>";
            for (let j = 0; j < cols; j++)
            {
                tableHTML += "<td></td>";
            }
            tableHTML += "</tr>";
        }
        tableHTML += "</tbody></table><p>&nbsp;</p>";

        const selection = window.getSelection();
        if (!selection.rangeCount)
        {
            editor.focus();
            selection.collapse(editor, editor.childNodes.length);
        }

        const range = selection.getRangeAt(0);
        const tableElement = document.createElement("div");
        tableElement.innerHTML = tableHTML;

        range.deleteContents();
        range.insertNode(tableElement);
        editor.focus();
        setShowTableSelector(false);
    };

    // Toolbar button component to apply formatting commands
    const ToolbarButton = ({ onClick, active, icon: Icon }) => (
        <button
            onClick={onClick}
            className={`${active ? "bg-blue-100 text-blue-600" : ""
                } p-2 hover:bg-gray-200`}
        >
            <Icon className="w-5 h-5" />
        </button>
    );

    // TableSelector component for selecting the table size
    const TableSelector = () =>
    {
        const maxRows = 8;
        const maxCols = 8;
        const [selectedSize, setSelectedSize] = useState({ rows: 0, cols: 0 });

        const cells = Array.from({ length: maxRows * maxCols }, (_, index) =>
        {
            const row = Math.floor(index / maxCols);
            const col = index % maxCols;
            const isSelected = row < selectedSize.rows && col < selectedSize.cols;

            return (
                <div
                    key={index}
                    className={`w-6 h-6 border border-gray-300 ${isSelected ? "bg-blue-200 border-blue-300" : "bg-white"
                        } m-0`}
                    onMouseOver={() => setSelectedSize({ rows: row + 1, cols: col + 1 })}
                    onMouseDown={(e) =>
                    {
                        e.preventDefault();
                        insertTable(row + 1, col + 1);
                    }}
                />
            );
        });

        return (
            <div className="absolute mt-2 w-48 h-68 p-2 bg-white rounded-lg shadow-lg z-50">
                <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-sm text-gray-600">
                        {selectedSize.rows > 0 && selectedSize.cols > 0
                            ? `${selectedSize.rows}×${selectedSize.cols} Table`
                            : "Select size"}
                    </span>
                    <button
                        onClick={() => setShowTableSelector(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-8 p-1">{cells}</div>
            </div>
        );
    };

    // Effect to update the formatting state (e.g., bold, italic) based on selection
    useEffect(() =>
    {
        const editor = editorRef.current;
        const updateActiveStates = () =>
        {
            setActiveStates({
                bold: document.queryCommandState("bold"),
                italic: document.queryCommandState("italic"),
                unorderedList: document.queryCommandState("insertUnorderedList"),
                orderedList: document.queryCommandState("insertOrderedList"),
                alignLeft: document.queryCommandState("justifyLeft"),
                alignCenter: document.queryCommandState("justifyCenter"),
                alignRight: document.queryCommandState("justifyRight"),
                alignJustify: document.queryCommandState("justifyFull"),
            });
        };

        editor.addEventListener("mouseup", updateActiveStates);
        editor.addEventListener("keyup", updateActiveStates);
        return () =>
        {
            editor.removeEventListener("mouseup", updateActiveStates);
            editor.removeEventListener("keyup", updateActiveStates);
        };
    }, []);

    // Effect to handle cell selection within the table in the editor
    useEffect(() =>
    {
        const editor = editorRef.current;

        const handleCellSelection = (event) =>
        {
            if (event.target.tagName === "TD")
            {
                event.target.classList.toggle("selected"); // Toggles 'selected' class on table cells
            }
        };

        editor.addEventListener("mouseup", handleCellSelection);

        return () =>
        {
            editor.removeEventListener("mouseup", handleCellSelection);
        };
    }, []);

    // Effect to apply custom styles to tables within the editor
    useEffect(() =>
    {
        const style = document.createElement("style");
        style.textContent = `
      .editor-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
      }
      .editor-content table td {
        border: 2px solid #444;
        padding: 8px;
        min-width: 50px;
        height: 30px;
        transition: background-color 0.2s;
      }
      .editor-content table tr:nth-child(even) td {
        background-color: #f9fafb;
      }
      .editor-content table tr:hover td {
        background-color: #e2e8f0;
      }
      .editor-content table td.selected {
        background-color: #b3d4fc;
        border-color: #4a90e2;
      }
      .editor-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 1rem 0; }
      .editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1rem 0; }
      .editor-content li { margin: 0.5rem 0; }
    `;
        document.head.appendChild(style);
        return () =>
        {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="border rounded-lg shadow-sm">
                <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
                    <ToolbarButton
                        onClick={() => toggleFormat("bold")}
                        active={activeStates.bold}
                        icon={Bold}
                    />
                    <ToolbarButton
                        onClick={() => toggleFormat("italic")}
                        active={activeStates.italic}
                        icon={Italic}
                    />
                    <ToolbarButton
                        onClick={() => toggleFormat("insertUnorderedList")}
                        active={activeStates.unorderedList}
                        icon={List}
                    />
                    <ToolbarButton
                        onClick={() => toggleFormat("insertOrderedList")}
                        active={activeStates.orderedList}
                        icon={ListOrdered}
                    />
                    <ToolbarButton
                        onClick={() => toggleFormat("justifyLeft")}
                        active={activeStates.alignLeft}
                        icon={AlignLeft}
                    />
                    <ToolbarButton
                        onClick={() => toggleFormat("justifyCenter")}
                        active={activeStates.alignCenter}
                        icon={AlignCenter}
                    />
                    <ToolbarButton
                        onClick={() => toggleFormat("justifyRight")}
                        active={activeStates.alignRight}
                        icon={AlignRight}
                    />
                    <ToolbarButton
                        onClick={() => toggleFormat("justifyFull")}
                        active={activeStates.alignJustify}
                        icon={AlignJustify}
                    />
                    {/* Button for inserting horizontal rule */}
                    <ToolbarButton
                        onClick={insertHR}
                        active={false}
                        icon={Minus} // Icon for <hr> button
                    />

                    {/* Button for opening the table selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTableSelector(!showTableSelector)}
                            className="p-2 hover:bg-gray-200"
                        >
                            <Table className="w-5 h-5" />
                        </button>
                        {showTableSelector && <TableSelector />}
                    </div>
                </div>

                {/* Editor Area with configurable height and scroll */}
                <div
                    ref={editorRef}
                    className="p-4 outline-none editor-content bg-white overflow-y-auto"
                    contentEditable={true}
                    onInput={handleInput}
                    style={{ minHeight: editorHeight, maxHeight: editorHeight }}
                    suppressContentEditableWarning={true}
                    role="textbox"
                    aria-multiline="true"
                    dir="ltr"
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
Performance