(function () {
  var xfetch = function (resource, init) {
    init = init || {};
    if (["post", "put", "delete"].indexOf(init.method) !== -1) {
      console.log("PUT, POST, DELETE");
    }
    return fetch(resource, init);
  };
  var api = function (method, endpoint, data) {
    return xfetch(endpoint, {
      method: method,
      body: data,
    });
  };

  var json = function (res) {
    return res.json();
  };

  window.api = {
    app: {
      list_drawings: function () {
        return api("GET", `./api/drawings`)
          .then(json)
          .then((res) => {
            let drawings = res.map(
              (drawing) =>
                `<div id="drawing_${drawing.name}" class="open_drawing_item">${drawing.name}</div>`
            );
            document.getElementById("drawing_list").innerHTML = drawings.join("");
            drawings = document.getElementsByClassName("open_drawing_item");
            var onDrawingClick = function () {
              this.style.backgroundColor = "var(--d15)"
              if (state.selected_div != null){
                  console.log(state.selected_div)
                  state.selected_div.style.backgroundColor = "white"
              }
              state.selected_div = this
            }
            for (var i = 0; i < drawings.length; i++){
                  drawings[i].addEventListener("click", onDrawingClick);
            }
            return drawings;
          });
      },
      load_drawing_metadata: function (name) {
        return api("GET", `./api/metadata/${name}`).then(json);
      },
      load_drawing: function (name) {
        return api("GET", `./api/${name}`)
          .then((res) => res.body)
          .then((stream) => new Response(stream))
          .then((response) => response.blob())
          .then((file) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function () {
              svgCanvas.setSvgString(JSON.parse(reader.result));
              editor.save_name = name;
              document.getElementById("save_name").innerText = name;
            };
            reader.onerror = function () {
              console.log(reader.error);
            };
          });
      },
      save_as_drawing: function (name, overwrite) {
        svgCanvas.clearSelection();
        const str = svgCanvas.svgCanvasToString();
        const blob = new Blob([str], { type: "image/svg+xml" });
        const file = new File([blob], name, { type: "image/svg_xml" });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("overwrite", overwrite);
        const resp = api("POST", `./api/saveas`, formData);
        return resp;
      },
      save_drawing: function(name) {
        svgCanvas.clearSelection();
        const str = svgCanvas.svgCanvasToString();
        const blob = new Blob([str], { type: "image/svg+xml" });
        const file = new File([blob], name, { type: "image/svg_xml" });
        const formData = new FormData();
        formData.append("file", file);
        const resp = api("POST", `./api/save`, formData);
        editor.save_name = name;
        document.getElementById("save_name").innerText = editor.save_name;
        return resp;
      },
      delete_drawing: function (name) {
        return api("DELETE", `./api/delete/${name}`).then(json);
      },
      toggle_public: function (name, isPublic) {
        return api(
          "PUT",
          `./api/public/${name}`,
          JSON.stringify({ public: isPublic })
        )
          .then(json)
          .then((res) => {
            return {
              raw_url: `${window.location.hostname}/public/raw/${name}`,
              edit_url: `${window.location.hostname}/public/?name=${name}`,
            };
          });
      },
    },
  };
})();

window.api.app.list_drawings().then((res) => console.log("Drawings init"));
