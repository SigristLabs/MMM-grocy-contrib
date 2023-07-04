Module.register("mmm-grocy-contrib", {
    defaults: {
        authKey: "None",
        grocyServer: "http://homeassistant.local:9192",
        title: "Chores",

        fetchInterval: 10 * 1000
    },
    grocyVersion: "Unknown",
    results: [],

    start: function () {
        // update timer
        setInterval(function() {
            this.getSystemInfo()
            this.updateDom(this.getSystemInfo(), this.config.updateInterval);
        });
    },
    
    getDom() {
        var data = this.results;
		var wrapper = document.createElement("ticker");
		wrapper.className = "ha-"+this.config.rowClass;

		// Starting to build the elements.
		var statElement = document.createElement("header");
		var title = this.config.title;
		statElement.innerHTML = title;

        if (data && !this.isEmpty(data)) {
            var tableElement = document.createElement("table");

            for (row of data) {
                var row = document.createElement("tr");

                var name = document.createElement("td");
                name.innerHTML = row.chore_name;

                row.appendChildname(name);

                tableElement.appendChild(row);
            }
        }
        return wrapper;
    },

    getSystemInfo() {
        fetch(`${this.config.grocyServer}/api/chores`).then((response) => {
            response.json().then((json) => {
                this.results = json;
                this.updateDom();

            })
        })
    }
});