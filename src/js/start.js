// globals
const svgCanvas = new $.SvgCanvas(document.getElementById("svgcanvas"));
const editor = new MD.Editor();
const state = new State();


editor.modal = {
  about: new MD.Modal({
    html: `
      <h1>About this application</h1>
      <p>Method Draw is a simple <a href="https://github.com/methodofaction/Method-Draw">open source</a> vector drawing application. Method Draw was forked from <a href="https://github.com/SVG-Edit/svgedit">SVG-Edit</a> several years ago with the goal of improving and modernizing the interface.</p>
      <p>At this time (2021), the author (<a href="http://method.ac/writing">Mark MacKay</a>) is working on improving stability and improving the codebase, which contains a lot of legacy practices. The goal is to create a vector editor suitable for simple graphic design tasks.</p>
      `,
  }),
  open: new MD.Modal({
    html: `
      <div  id="open_menu">
          <div class="menu_item" >Nothing to see</div>
      </div>
    `,
  }),
  share: new MD.Modal({
    html: `
    <div>
    <h4>Share your drawing. Make it public</h4> 
    <label class="switch">
    <input id="public_toggle" id="public-toggle" type="checkbox">
    <span class="slider round"></span>
    </label>
    <code id="URL"></code>
    </div>
    `,
    js: function(el) {
      el.querySelector("#public_toggle").addEventListener("change", function() {
        const inputBox = document.getElementById("public-toggle");
        document.getElementById("URL").innerHTML = "  dsd";
        _api.togglePublic(editor.save_name).then(res=> {
            document.getElementById("URL").innerHTML = res["raw_url"];
        })
      })
    }
  }),
  save: new MD.Modal({
    html: `
    <textarea  maxlength="50" style="height: 20px; resize: none;" id="filename" spellcheck="false"></textarea>
    <div id="tool_source_back" class="toolbar_button">
    <button id="tool_source_cancel" class="cancel">Cancel</button>
    <button id="tool_source_save" class="ok">Ok </button>
    </div>
    `,
    js: function (el) {
      el.querySelector("#tool_source_save").addEventListener(
        "click",
        function () {
          let filename = document.getElementById("filename").value;
          filename = `${filename}.svg`;
          return _api.getDrawing(filename).then((res) => {
            if (res === true) {
              console.log("The file doesn't exist.")
              editor.save_name = filename;
              svgCanvas.clearSelection();
              const str = svgCanvas.svgCanvasToString();
              const blob = new Blob([str], { type: "image/svg+xml" });
              const file = new File([blob], editor.save_name, { type: "image/svg_xml" });
              const formData = new FormData();
              formData.append("file", file);
              formData.append("name", editor.save_name);
              return _api.saveDrawing(formData).then((res) => {
                  editor.modal.save.close();
                  document.getElementById("save_name").innerText = editor.save_name;
              });
            } 
            const confirm = window.confirm("Are you sure you want to override the file?")
            if (confirm){
              editor.save_name = filename;
              svgCanvas.clearSelection();
              const str = svgCanvas.svgCanvasToString();
              const blob = new Blob([str], { type: "image/svg+xml" });
              const file = new File([blob], editor.save_name, { type: "image/svg_xml" });
              const formData = new FormData();
              formData.append("file", file);
              formData.append("name", editor.save_name);
              return _api.saveDrawing(formData).then((res) => {
                  editor.modal.save.close();
                  document.getElementById("save_name").innerText = editor.save_name;
              });
            } else {
              editor.modal.save.close();
            }
          });
        }
      );
      el.querySelector("#tool_source_cancel").addEventListener(
        "click",
        function () {
          editor.modal.save.close();
        }
      );
    },
  }),
  source: new MD.Modal({
    html: `
      <div id="svg_source_editor">
        <div id="svg_source_overlay" class="overlay"></div>
        <div id="svg_source_container">
          <form>
            <textarea id="svg_source_textarea" spellcheck="false"></textarea>
          </form>
          <div id="tool_source_back" class="toolbar_button">
            <button id="tool_source_cancel" class="cancel">Cancel</button>
            <button id="tool_source_save" class="ok">Apply Changes</button>
          </div>
        </div>
    </div>`,
    js: function (el) {
      el.children[0].classList.add("modal-item-source");
      el.querySelector("#tool_source_save").addEventListener(
        "click",
        function () {
          var saveChanges = function () {
            svgCanvas.clearSelection();
            $("#svg_source_textarea").blur();
            editor.zoom.multiply(1);
            editor.rulers.update();
            editor.paintBox.fill.prep();
            editor.paintBox.stroke.prep();
            editor.modal.source.close();
          };

          if (!svgCanvas.setSvgString($("#svg_source_textarea").val())) {
            $.confirm(
              "There were parsing errors in your SVG source.\nRevert back to original SVG source?",
              function (ok) {
                if (!ok) return false;
                saveChanges();
              }
            );
          } else {
            saveChanges();
          }
        }
      );
      el.querySelector("#tool_source_cancel").addEventListener(
        "click",
        function () {
          editor.modal.source.close();
        }
      );
    },
  }),
  configure: new MD.Modal({
    html: `
      <h1>Configuration</h1>
      <div id="configuration">
        <button class="warning">Erase all data</button>
        </div>
      </div>`,
    js: function (el) {
      const input = el.querySelector("#configuration button.warning");
      input.addEventListener("click", function () {
        state.clean();
      });
    },
  }),
  donate: new MD.Modal({
    html: `
      <h1>Donate</h1>
      <p>
        Method Draw relies on your generous donations for continued development.
        <a href="https://method.ac/donate/">Donate now</a> if you find this application useful.
      </p>`,
  }),
  shortcuts: new MD.Modal({
    html: `
      <h1>Shortcuts</h1>
      <div id="shortcuts"></div>`,
    js: function (el) {
      el.children[0].classList.add("modal-item-wide");
    },
  }),
};

editor.keyboard = new MD.Keyboard();
editor.menu = new MD.Menu();
editor.toolbar = new MD.Toolbar();
editor.rulers = new MD.Rulers();
editor.canvas = new MD.Canvas();
editor.text = new MD.Text();
editor.panel = new MD.Panel();
editor.zoom = new MD.Zoom();
editor.paintBox = {
  fill: new MD.PaintBox("#fill_color", "fill"),
  stroke: new MD.PaintBox("#stroke_color", "stroke"),
  canvas: new MD.PaintBox("#canvas_color", "canvas"),
};
editor.palette = new MD.Palette();
editor.pan = new MD.Pan();

editor.import = new MD.Import();
editor.contextMenu = new MD.ContextMenu();

// bind the selected event to our function that handles updates to the UI
svgCanvas.bind("selected", editor.selectedChanged);
svgCanvas.bind("transition", editor.elementTransition);
svgCanvas.bind("changed", editor.elementChanged);
svgCanvas.bind("exported", editor.exportHandler);
svgCanvas.bind("zoomed", editor.zoom.changed);
svgCanvas.bind("contextset", editor.contextChanged);
svgCanvas.bind("extension_added", editor.extensionAdded);
svgCanvas.textActions.setInputElem($("#text")[0]);
const shapeLib = svgCanvas.addExtension.apply(this, ["shapes", MD.Shapelib]);
const eyedropper = svgCanvas.addExtension.apply(this, [
  "eyedropper",
  MD.Eyedropper,
]);
state.set("canvasId", t("Untitled"));
state.set("canvasMode", state.get("canvasMode"));
// svgCanvas.setSvgString(state.get("canvasContent"));
// editor.paintBox.fill.setPaint(state.get("canvasFill"));
// editor.paintBox.stroke.setPaint(state.get("canvasStroke"));
// editor.paintBox.canvas.setPaint(state.get("canvasBackground"));
