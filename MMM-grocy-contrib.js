

Module.register("MMM-grocy-contrib", {
    defaults: {
        authKey: "None",
        grocyServer: "http://homeassistant.local:9192",
        title: "Chores",

        iconOverdue: "alert-box-outline",

        fetchInterval: 300000        
    },
    grocyVersion: "Unknown",
    results: [],

    start: function () {
        Log.info("Comecou");
        let self = this;
        self.getSystemInfo();
        // update timer
        setInterval(function() {
            self.getSystemInfo()
            self.updateDom(() => {
                self.getSystemInfo();
            }, this.config.updateInterval);
        });
    },

    _toDateTime(date) {
        return moment(date);
    },
    _calculateDaysTillNow(date) {
        const now = moment();
        return date.startOf('day').diff(now.startOf('day'), 'days').days;
    },
    _formatItemDescription(item) {
        let d = null;
        if(this.show_description && item.description) {
            d = item.description;
            if(this.description_max_length && (d.length > this.description_max_length)) {
                d = d.substring(0, this.description_max_length) + "...";
            }
        }
        item.__description = d;
    },
    _isItemVisible(item) {
        let visible = false;
        
        if(item.__due_in_days == null) {
            visible = true;
            visible = visible && (item.__type === "chore" ? true : true);
            visible = visible && (item.__type === "task" ? true : true);
        } else {
            visible = visible || this.show_days == null;
            visible = visible || (item.__due_in_days < 0);

            if(this.show_days != null) {
                const days_range = typeof this.show_days === "number" ? [this.show_days] : this.show_days.split("..", 2);
                if(days_range.length === 1) {
                    visible = visible || (item.__due_in_days <= days_range[0]);
                } else {
                    visible = visible || ((item.__due_in_days <= days_range[1]) && (item.__due_in_days >= days_range[0]));
                }
            }
        }

        visible = visible && (this.filter !== undefined ? this._checkMatchNameFilter(item) : true);
        visible = visible && (this.filter_user !== undefined ? this._checkMatchUserFilter(item) : true);

        if(item.__type === "task" && this.filter_task_category !== undefined) {
            visible = visible && this._checkMatchTaskCategoryFilter(item);
        }

        return visible;
    },    
    getScripts: function() {
        return [
            'moment.js' // this file is available in the vendor folder, so it doesn't need to be available in the module folder.
        ]
    },
    
    getDom() {
        
        var data = this.results;
		var wrapper = document.createElement("ticker");
		wrapper.className = "ha-"+this.config.rowClass;

		// Starting to build the elements.
		var statElement = document.createElement("header");
		var title = this.config.title;
		statElement.innerHTML = title;

        wrapper.appendChild(statElement);

        const isToday = (someDate) => {
            const today = new Date()
            return someDate.getDate() == today.getDate() &&
              someDate.getMonth() == today.getMonth() &&
              someDate.getFullYear() == today.getFullYear()
        }
        

        if (data) {
            let now = new Date();
            
            var tableElement = document.createElement("table");
            wrapper.appendChild(tableElement);
            const chores = [];

            data.map(item => {
                // Log.info(item)
                item.__type = "chore";
                if (item.next_execution_assigned_user) {
                    item.__user_id = item.next_execution_assigned_user.id;
                }
    
                if (item.next_estimated_execution_time != null && item.next_estimated_execution_time.slice(0, 4) !== 2999) {
                    item.__due_date = this._toDateTime(item.next_estimated_execution_time);
                    item.__due_in_days = this._calculateDaysTillNow(item.__due_date);
                }
    
                if (item.last_tracked_time) {
                    item.__last_tracked_date = this._toDateTime(item.last_tracked_time);
                    item.__last_tracked_days = Math.abs(this._calculateDaysTillNow(item.__last_tracked_date));
                }
    
                this._formatItemDescription(item);
    
                
                if (this._isItemVisible(item)) {
                    Log.info("Adicionei item " + item.name);
                    chores.push(item);
                }    
            })

            for (row of chores) {
                let lastTrackedTime = new Date(row.last_tracked_time);
                let nextEstimatedExecutionTime = new Date(row.next_estimated_execution_time);

                let doToday = isToday(nextEstimatedExecutionTime);
                let overdue = nextEstimatedExecutionTime.getTime() < now.getTime() && !doToday;
                let show = overdue || doToday;
            
                Log.info(`Now ${row.chore_name}: [${now} | Last Tracked Time [${lastTrackedTime}] | next [${nextEstimatedExecutionTime}] | overdue [${overdue}] | doToday [${doToday}] | show [${show}]`);

                if (show) {
                    var tr = document.createElement("tr");
                    var name = document.createElement("td");
                    var overdueCol  = document.createElement("td");
                    overdueCol.className = "ha-icon";
                    
                    name.innerHTML = `${row.chore_name}`;
                    if (overdue) {
                        let iconsinline = document.createElement("i");
                        iconsinline.className = `mdi ${this.config.iconOverdue}`                        
                        overdueCol.appendChild(iconsinline);
                        
                    } else {
                        overdueCol.innerHTML = "";
                    }
    
                    tr.appendChild(overdueCol);
                    tr.appendChild(name);
    
                    tableElement.appendChild(tr);
    
                }
                
            }
            
        }
        
        return wrapper;
    },

    getSystemInfo() {
        const headers = {            
            "GROCY-API-KEY": this.config.authKey,
        };
        
        fetch(`${this.config.grocyServer}/api/chores`, { headers: headers}).then((response) => {
            if (response.status == 200) {                
                response.json().then((json) => {
                
                    this.results = json;
                    this.updateDom();
    
                })    
            } else {
                Log.info(`Error calling api: ${response.status} - ${response.statusText}`);
            }
        })
    }
});