// globals
const svgCanvas = new $.SvgCanvas(document.getElementById("svgcanvas"));
const editor = new MD.Editor();
const state = new State();

const isDetaRuntime =
  location.hostname === "deta.app" ||
  location.hostname === "deta.app" ||
  location.hostname === "127.0.0.1";

const detaMods = () => {
  document.getElementById("tool_copen").style.display = "none";
  document.getElementById("tool_csave").style.display = "none";
  document.getElementById("tool_csaveas").style.display = "none";
  document.getElementById("tool_cdelete").style.display = "none";
  document.getElementById("save_name").style.display = "none";
};


if (!isDetaRuntime) detaMods();

editor.modal = {
  about: new MD.Modal({
    html: `
      <h1>About this application</h1>
      <p>Method Draw is a simple <a href="https://github.com/methodofaction/Method-Draw">open source</a> vector drawing application. Method Draw was forked from <a href="https://github.com/SVG-Edit/svgedit">SVG-Edit</a> several years ago with the goal of improving and modernizing the interface.</p>
      <p>At this time (2021), the author (<a href="http://method.ac/writing">Mark MacKay</a>) is working on improving stability and improving the codebase, which contains a lot of legacy practices. The goal is to create a vector editor suitable for simple graphic design tasks.</p>
      `,
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
  cloudSaveAs: new MD.Modal({
    html: `<h3>Please name your drawing.</h3>
    <div class='save_text_block'>
       <textarea id='filename' class='save_textarea' spellcheck='false'></textarea>
       <div class='ext_tag'> .svg</div>
    </div>
    <h4 id="save_warning" class="save_warning"></h4>
    <div class="save_modal_btn_row">
       <button id="save_cancel_btn" class="cancel">Cancel</button>
       <button id="save_ok_btn" class="ok">Ok</button>
       <button id="save_confirm_btn" class="save_confirm_btn">Confirm</button>
    </div>
    `,
    js: function (el) {
      const revertState = () => {
        document.getElementById("filename").value = "";
        document.getElementById("save_warning").style.display = "none";
        document.getElementById("save_confirm_btn").style.display = "none";
        document.getElementById("save_ok_btn").style.display = "inherit";
        $("#filename").prop("readonly", false);
      };
      el.querySelector("#save_cancel_btn").addEventListener(
        "click",
        function () {
          editor.modal.cloudSaveAs.close();
          revertState();
        }
      );
      el.querySelector("#save_ok_btn").addEventListener("click", function () {
        let filename = `${document.getElementById("filename").value}.svg`;
        window.api.app.save_as_drawing(filename, false).then((res) => {
          if (res.status === 409) {
            document.getElementById(
              "save_warning"
            ).innerHTML = `${filename} already exists. Please click 'confirm' if you would like to overwrite it.`;
            document.getElementById("save_warning").style.display = "block";
            document.getElementById("save_ok_btn").style.display = "none";
            document.getElementById("save_confirm_btn").style.display = "block";
            $("#filename").prop("readonly", true);
          } else {
            editor.modal.cloudSaveAs.close();
            editor.save_name = filename;
            document
              .getElementById("tool_cdelete")
              .classList.remove("disabled");
            document.getElementById("save_name").innerText = editor.save_name;
            revertState();
          }
        });
      });
      el.querySelector("#save_confirm_btn").addEventListener(
        "click",
        function () {
          filename = `${document.getElementById("filename").value}.svg`;
          window.api.app.save_as_drawing(filename, true).then((res) => {
            console.log("Overwrite...", filename);
            editor.save_name = filename;
            document
              .getElementById("tool_cdelete")
              .classList.remove("disabled");
            document.getElementById("save_name").innerText = editor.save_name;
            revertState();
            editor.modal.cloudSaveAs.close();
          });
        }
      );
    },
  }),
  cloudOpen: new MD.Modal({
    html: `
    <h3>Please select an svg to open.</h3>
    <div id="drawing_list" class="open_drawing_list">
      Nothing to see here.
    </div>
    <div class="save_modal_btn_row">
      <button id="open_cancel" class="cancel">Cancel</button>
      <button id="open_ok" class="open">Ok</button>
    </div>
    `,
    js: function (el) {
      el.querySelector("#open_cancel").addEventListener("click", function () {
        editor.modal.cloudOpen.close();
      });
      el.querySelector("#open_ok").addEventListener("click", function () {
        if (state.selected_div == null) {
          editor.modal.cloudOpen.close();
        } else {
          const filename = state.selected_div.innerText;
          // load the drawing
          window.api.app.load_drawing(filename).then((res) => {
            document
              .getElementById("tool_cdelete")
              .classList.remove("disabled");

            editor.modal.cloudOpen.close();
          });
        }
      });
    },
  }),
  cloudDelete: new MD.Modal({
    html: `
    <h4>Are you sure you want to delete your drawing?</h4>
    <p>This will clear the current drawing and erase its undo history.</p>
    <div class="save_modal_btn_row">
      <button id="delete_cancel" class="cancel">Cancel</button>
      <button id="delete_confirm" class="delete_drawing_btn">Delete</button>
    </div>
    `,
    js: function (el) {
      el.querySelector("#delete_cancel").addEventListener("click", function () {
        editor.modal.cloudDelete.close();
      });
      el.querySelector("#delete_confirm").addEventListener(
        "click",
        function () {
          window.api.app.delete_drawing(editor.save_name).then((res) => {
            state.set("canvasMode", "select");
            svgCanvas.clear();
            svgCanvas.setResolution(800, 600);
            editor.canvas.update();
            editor.zoom.reset();
            editor.panel.updateContextPanel();
            editor.paintBox.fill.prep();
            editor.paintBox.stroke.prep();
            svgCanvas.runExtensions("onNewDocument");
            this.save_name = undefined;
            document.getElementById("save_name").innerHTML = "untitled.svg";
            document.getElementById("tool_cdelete").classList.add("disabled");
            editor.modal.cloudDelete.close();
          });
        }
      );
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
svgCanvas.setSvgString(state.get("canvasContent"));
editor.paintBox.fill.setPaint(state.get("canvasFill"));
editor.paintBox.stroke.setPaint(state.get("canvasStroke"));
editor.paintBox.canvas.setPaint(state.get("canvasBackground"));
