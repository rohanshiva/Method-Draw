class API {
    constructor() {
      this.api = "./api";
    }
    fetchDrawings() {
      const url = `${this.api}/drawings`;
      return fetch(url)
        .then((res) => res.json())
        .then((ds) => {
          if (ds.length === 0) return;
          let keys = ds.map(
            (s) =>
              `<div class="menu_item" onclick="_api.openDrawing(event)" >${s.key}</div><br>`
          );
          document.getElementById("open_menu").innerHTML = keys.join("");
        });
    }
    deleteDrawing(name) {
        const url = `${this.api}/delete/${name}`
        return fetch(url)
            .then(res=> {
                this.fetchDrawings();
            })
    }
    togglePublic(name) {
        const url = `${this.api}/public/${name}`
        return fetch(url)
            .then(res => {
                return {"raw_url": `./public/raw/${name}`, "edit_url": `./public/${name}`}
            })
    }
    getDrawing(name){
        const url = `${this.api}/${name}`
        return fetch(url)
            .then(res=> res.json())
            .then(r => {
                if (r === false){
                    return true
                }
                else {
                    return false
                }
            })
    } 
    saveDrawing(formData) {
      const url = `${this.api}/save`;
      return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        body: formData, // body data type must match "Content-Type" header
      }).then((res) => {
        this.fetchDrawings();
      });
    }
    loadDrawing(name) {
      const url = `${this.api}/${name}`;
      return fetch(url)
        .then((res) => res.body)
        .then((stream) => new Response(stream))
        .then((response) => response.blob())
        .then((blob) => blob)
        .then((file) => {
          var reader = new FileReader();
          reader.readAsText(file);
          reader.onload = function () {
            svgCanvas.setSvgString(JSON.parse(reader.result));
            editor.save_name = name;
            document.getElementById("save_name").innerText = name;
          };
          reader.onerror = function () {
            console.log(reader.error);
          };
        })
        .catch((error) => {
          console.log("Failed to open svg");
        });
    }
    openDrawing(e) {
      let cdn = e.target.innerText;
      this.loadDrawing(cdn);
    }
    fetchLatest() {
      const url = `${this.api}/drawings`;
      return fetch(url)
        .then((res) => res.json())
        .then((ds) => {
          const latest = ds.sort((a, b) => b.lastModified - a.lastModified)[0];
          return latest.key;
        });
    }
  }
  
  const _api = new API();
  _api.fetchDrawings();