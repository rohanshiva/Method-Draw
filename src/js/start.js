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
      `
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
      el.querySelector("#tool_source_save").addEventListener("click", function () {
        var saveChanges = function () {
          svgCanvas.clearSelection();
          $('#svg_source_textarea').blur();
          editor.zoom.multiply(1);
          editor.rulers.update();
          editor.paintBox.fill.prep();
          editor.paintBox.stroke.prep();
          editor.modal.source.close();
        }

        if (!svgCanvas.setSvgString($('#svg_source_textarea').val())) {
          $.confirm("There were parsing errors in your SVG source.\nRevert back to original SVG source?", function (ok) {
            if (!ok) return false;
            saveChanges();
          });
        } else {
          saveChanges();
        }
      })
      el.querySelector("#tool_source_cancel").addEventListener("click", function () {
        editor.modal.source.close();
      });
    }
  }),
  // deta modals
  cloudSave: new MD.Modal({
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
        $('#filename').prop('readonly', false);
      };
      el.querySelector("#save_cancel_btn").addEventListener("click", function () {
        revertState();
        editor.modal.cloudSave.close();
      })
      el.querySelector("#save_ok_btn").addEventListener("click", function () {
        let filename = `${document.getElementById("filename").value}.svg`;
        editor.saveBlock(filename).then(res => {
          console.log(res);
          if (res.status === 409) {
            document.getElementById("save_warning").innerHTML = `${filename} already exists. Please click 'confirm' if you would like to overwrite it.`
            document.getElementById("save_warning").style.display = "block";
            document.getElementById("save_ok_btn").style.display = "none";
            document.getElementById("save_confirm_btn").style.display = "block";
            $('#filename').prop('readonly', true);
          } else {
            revertState();
            editor.modal.cloudSave.close();
          }
        })
      })
      el.querySelector("#save_confirm_btn").addEventListener("click", function () {
        filename = `${document.getElementById("filename").value}.svg`;
        editor.saveBlock(filename, true).then(res => {
          console.log("Overwrite...", filename)
          revertState();
          // document.getElementById("save_name").innerText = "";
          // document.getElementById("tool_csave").classList.remove("disabled");
          // document.getElementById("tool_cdel").classList.remove("disabled");
          editor.modal.cloudSave.close();
        })
      })
    }
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
      })
    }
  }),
  donate: new MD.Modal({
    html: `
      <h1>Donate</h1>
      <p>
        Method Draw relies on your generous donations for continued development.
        <a href="https://method.ac/donate/">Donate now</a> if you find this application useful.
      </p>`
  }),
  shortcuts: new MD.Modal({
    html: `
      <h1>Shortcuts</h1>
      <div id="shortcuts"></div>`,
    js: function (el) {
      el.children[0].classList.add("modal-item-wide");
    }
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
  fill: new MD.PaintBox('#fill_color', 'fill'),
  stroke: new MD.PaintBox('#stroke_color', 'stroke'),
  canvas: new MD.PaintBox('#canvas_color', 'canvas')
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
const eyedropper = svgCanvas.addExtension.apply(this, ["eyedropper", MD.Eyedropper]);
state.set("canvasId", t("Untitled"));
state.set("canvasMode", state.get("canvasMode"));
svgCanvas.setSvgString(state.get("canvasContent"));
editor.paintBox.fill.setPaint(state.get("canvasFill"));
editor.paintBox.stroke.setPaint(state.get("canvasStroke"));
editor.paintBox.canvas.setPaint(state.get("canvasBackground"));