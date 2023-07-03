Module.register("MMM-grocy-contrib", {
    defaults: {
        category: "Grocy",
        fetchInterval: 10 * 1000
    },
    grocyVersion: "Unknown",

    notificationReceived(notification, payload, sender) {
        if (notification === "MODULE_DOM_CREATED") {
            this.getSystemInfo();
            setInterval(() => {
                this.getSystemInfo()
            }, this.config.fetchInterval);
        }
    },

    getDom() {
        const wrapper = document.createElement("div");

        if (this.grocyVersion === null) return wrapper;

        wrapper.innerHTML = "Grocy Version: " + this.grocyVersion;

        return wrapper;
    },

    getSystemInfo() {
        fetch("http://homeassistant.local:9192/api/system/info").then((response) => {
            response.json().then((json) => {
                this.grocyVersion = json.grocy_version.Version;
                this.updateDom();

            })
        })
    }
}