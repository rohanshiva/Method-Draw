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
              (drawing) => `<div class="open_drawing_item">${drawing.name}</div>`
            );
            //   document.getElementById("open_drawing_list").innerHTML = drawings.join("");
            localStorage.setItem("drawings", drawings.join(""));

            return drawings.join("");
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
              document
                .getElementById("tool_csave")
                .classList.remove("disabled");
              document.getElementById("tool_cdel").classList.remove("disabled");
              window.api.app.load_drawing_metadata(name).then((res) => {
                document.getElementById("public_toggle").checked =
                  res["public"];
                if (document.getElementById("public_toggle").checked){
                    document.getElementById("share_links").style.display = "block";
                    document.getElementById("raw_url").value = `${window.location.hostname}/public/raw/${editor.save_name}`
                    document.getElementById("edit_url").value = `${window.location.hostname}/public/?name=${editor.save_name}`
                    document.getElementById("share_desc").innerHTML =
                    "Anyone with the link can view your work.";
                } else {
                    document.getElementById("share_desc").innerHTML =
                    "Make your drawing public and share a link with anyone";
                    document.getElementById("share_links").style.display = "none";
                }
              });
            };
            reader.onerror = function () {
              console.log(reader.error);
            };
          });
      },
      save_drawing: function (formData) {
        return api("POST", `./api/save`, formData)
          .then((res)=> {
            if(!res.ok){
              throw new Error("409 Conflict Error")
            }
            return res.json()
          })
          .then((ds) => window.api.app.list_drawings())
          .catch((err)=> {throw err});
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
