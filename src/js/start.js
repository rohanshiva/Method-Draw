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
  share: new MD.Modal({
    html: `
    <div class="share-container">
    <div class="share_info">
      <h3>Share to web.</h3>
      <p id="share_desc">Make your drawing public and share a link with anyone</p>
    </div>
    <div class="share_btn_grid">     
      <label class="switch">
      <input id="public_toggle" id="public_toggle" type="checkbox">
      <span class="slider round"></span>
      </label>
    </div>
    </div>
    
    <div id="share_links" class="share_links">
      <h4>Raw SVG:</h4>
      <div class="share_url">
        <textarea spellcheck="false" class="url" id="raw_url">
          https://deta.dev
        </textarea>
        <div class="copy" >
          <div id="copy_raw"> 
            Copy
          </div>
        </div>
      </div>
      <h4>Your SVG in Method Draw:</h4>
      <div class="share_url">
        <textarea spellcheck="false" class="url" id="edit_url">
        https://deta.dev/edit
        </textarea>
        <div class="copy">
          <div id="copy_edit">
          Copy
          </div>
        <div>
      </div>
    </div>

    `,
    js: function (el) {
      el.querySelector("#public_toggle").addEventListener(
        "change",
        async function () {
          const isPublic = document.getElementById("public_toggle");
          if (isPublic.checked) {
            const res = await window.api.app.toggle_public(editor.save_name, isPublic.checked);
            document.getElementById("share_links").style.display = "block";
            document.getElementById("raw_url").value = res["raw_url"]
            document.getElementById("edit_url").value = res["edit_url"]
            document.getElementById("share_desc").innerHTML =
              "Anyone with the link can view your work.";
          } else {
            const res = await window.api.app.toggle_public(editor.save_name, isPublic.checked);
            document.getElementById("share_desc").innerHTML =
              "Make your drawing public and share a link with anyone";
            document.getElementById("share_links").style.display = "none";
          }
        }
      );
      el.querySelector("#copy_raw").addEventListener("click", function() {
        const raw_url = document.getElementById("raw_url")
        raw_url.select();
        raw_url.setSelectionRange(0, 99999);
        document.execCommand("copy");
      })
      el.querySelector("#copy_edit").addEventListener("click", function() {
        const edit_url = document.getElementById("edit_url")
        edit_url.select();
        edit_url.setSelectionRange(0, 99999);
        document.execCommand("copy");
      })
    },
  }),
  save: new MD.Modal({
    html: `<h3>Please name your drawing.</h3>
    <div class='save_block'>
       <textarea id='filename' maxlength='50' class='save_input' spellcheck='false'></textarea>
       <h3 class='ext_tag'> .svg</h3>
    </div>
    <h4 id="save_warning" class="save_warning">.svg already exists. Please click 'confirm' if you would like to override it.</h4>
    <div class="save_modal_btn_bar">
       <button id="cancel_save" style="
          margin-right: 10rem;
          " class="cancel">Cancel</button>
       <button id="save_ok" class="ok">Ok</button>
       <button id="confirm_save" class="confirm_save">Confirm</button>
    </div>
    `,
    js: function (el) {
      el.querySelector("#cancel_save").addEventListener("click", function() {
        editor.modal.save.close();
      })
      el.querySelector("#save_ok").addEventListener("click", function() {
        let filename = `${document.getElementById("filename").value}.svg`;
        editor.modal.save.close();
        editor.modal.loading.open();
        editor.saveBlock(filename, false).then(res=> {
          document.getElementById("tool_csave").classList.remove("disabled");
          document.getElementById("tool_cdel").classList.remove("disabled");
          editor.modal.loading.close();
          document.getElementById("save_name").innerText = filename;
          document.getElementById("filename").value = ""
        }).catch((err)=> {
          editor.modal.loading.close();
          editor.modal.save.open();
          document.getElementById("save_warning").innerHTML = `${filename} already exists. Please click 'confirm' if you would like to override it.`
          document.getElementById("save_warning").style.display = "block";
          document.getElementById("save_ok").style.display = "none";
          document.getElementById("confirm_save").style.display = "block";
        })
      })
      el.querySelector("#confirm_save").addEventListener("click", function() {
        filename = `${document.getElementById("filename").value}.svg`;
        editor.modal.save.close();
        editor.modal.loading.open();
        editor.saveBlock(filename, true).then(res=> {
          console.log("Overwrite...", res)
          document.getElementById("save_ok").style.display = "inherit";
          document.getElementById("save_warning").style.display = "none";
          document.getElementById("confirm_save").style.display = "none";
          document.getElementById("save_name").innerText = filename;
          document.getElementById("tool_csave").classList.remove("disabled");
          document.getElementById("tool_cdel").classList.remove("disabled");
          editor.modal.loading.close();
          document.getElementById("filename").value = ""
        }).catch((err)=> console.log("Error"))
      })
    }
  }),
  delete: new MD.Modal({
    html: `<h3>Are you sure you want to delete yoru drawing?</h3>
      <p>This will clear the current drawing and erase its undo history.</p>
      <div class="save_modal_btn_bar">
        <button id="cancel_delete" class="cancel" style="margin-right: 10rem;">Cancel</button>
        <button id="delete_drawing" class="delete_btn">Delete</button>
      </div>
    `,
    js: function(el) {
      el.querySelector("#delete_drawing").addEventListener("click", function() {
        window.api.app.delete_drawing(editor.save_name).then(res=> {
          state.set("canvasMode", "select");
          svgCanvas.clear();
          editor.save_name = undefined;
          document.getElementById("tool_csave").classList.add("disabled");
          document.getElementById("tool_cdel").classList.add("disabled");
          document.getElementById("save_name").innerText = "untitled.svg";
          svgCanvas.setResolution(800, 600);
          editor.canvas.update();
          editor.zoom.reset();
          editor.panel.updateContextPanel();
          editor.paintBox.fill.prep();
          editor.paintBox.stroke.prep();
          svgCanvas.runExtensions("onNewDocument");
          editor.modal.delete.close();
        })
      })
      el.querySelector("#cancel_delete").addEventListener("click", function() {
        editor.modal.delete.close();
      })
    }
  }), 
  open: new MD.Modal({
    html: `<h3>Please select an svg to open.</h3>
      <div id = "open_drawing_list" class="open_drawing_list">
        <div class="open_drawing_item">1 here</div>
        <div class="open_drawing_item">2 here</div>
        <div class="open_drawing_item">3 here</div>
        <div class="open_drawing_item">4 here</div>
        <div class="open_drawing_item">5 here</div>
        <div class="open_drawing_item">6 here</div>
        <div class="open_drawing_item">7 here</div>
        <div class="open_drawing_item">8 here</div>
        <div class="open_drawing_item">9 here</div>
        <div class="open_drawing_item">10 here</div>
      </div>
      <div class="save_modal_btn_bar">
        <button id="cancel_open" class="cancel" style="margin-right: 10rem;">Cancel</button>
        <button id="open_ok" class="open">Ok</button>
      </div>
    `,
    js: async function(el) {
      let selected_div = null;
      const ds = await window.api.app.list_drawings();
      el.querySelector("#open_drawing_list").innerHTML = ds;
      el.querySelector("#cancel_open").addEventListener("click", function() {
        editor.modal.open.close();
      })
      el.querySelector("#open_ok").addEventListener("click", async function(){
        if (selected_div == null){
          editor.modal.open.close();
        } else {
          const filename = selected_div.innerText;
          editor.modal.loading.open();
          await window.api.app.load_drawing(filename);
          editor.modal.loading.close();
          editor.modal.open.close();
        }
      })
      const drawings = document.getElementsByClassName("open_drawing_item");
      var onDrawingClick = function () {
        this.style.backgroundColor = "var(--d15)"
        if (selected_div != null){
          selected_div.style.backgroundColor = "white"
        }
        selected_div = this
        console.log(this.innerText);
      }
      for (var i = 0; i < drawings.length; i++){
        drawings[i].addEventListener("click", onDrawingClick);
      }
    }
  }),
  loading: new MD.Modal({
    html: `<h4>Loading</h4>`
  })
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
svgCanvas.setSvgString(`<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
<g id="Layer_1">
 <title>Layer 1</title>
</g>
</svg>`);
editor.paintBox.fill.setPaint({
  type: "solidColor",
  solidColor: "ffffff",
  alpha: 100,
});
editor.paintBox.stroke.setPaint({
  type: "solidColor",
  solidColor: "000000",
  alpha: 100,
});
editor.paintBox.canvas.setPaint({
  type: "solidColor",
  solidColor: "ffffff",
  alpha: 100,
});
if(!window.Location.hostname.contains("deta.dev")) {
  document.getElementById("tool_copen").style.display = "none"
document.getElementById("tool_csave").style.display = "none"
document.getElementById("tool_csaveas").style.display = "none"
document.getElementById("tool_cdel").style.display = "none"
document.getElementById("save_name").style.display = "none"
document.getElementById("share").style.display = "none"
}
