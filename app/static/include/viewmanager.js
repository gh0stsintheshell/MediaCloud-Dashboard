/**
 * ViewManager - A class to manage creation and destruction of views in single
 * page applicaitons.
 *
 * Dependencies:
 *   - jQuery
 *   - underscore.js
 *
 * The main methods are:
 *
 * initialize() - Always call before using other functions.
 *
 * getView(type, options) - The first time this is called for View constructor
 * `type`, a new object is created, passing `options` to the constructor.
 * Subsequent calls return the previously created View, unless it has been
 * closed.
 *
 * showViews(views) - Show the Views given by the `views` array.  Those that
 * were previously visible will remain visible and retain their state.  Those
 * that were not, will be created.  Previously visible Views not in `views`
 * will be closed.
 *
 * addView(view) - Add a single view to the end of the content, without closing
 * any.
 *
 */

App.ViewManager = {
    initialize: function (options) {
        this.views = [];
        this.viewMap = {};
    },
    closeView: function (view) {
    },
    /*
     * Given a view constructor and options, get the instance of that view
     * constructor or create one if none exists.
     */
    getView: function (type, options) {
        App.debug('App.Router.getView()');
        // Ensure the view lookup exits 
        if (!this.viewsByType) {
            this.viewsByType = {}
        }
        // Ensure the type has a unique lookup key
        if (!type.prototype.viewLookupKey) {
            type.prototype.viewLookupKey = _.uniqueId()
        }
        if (this.viewsByType[type.prototype.viewLookupKey]) {
            App.debug('  returning existing view');
            return this.viewsByType[type.prototype.viewLookupKey];
        }
        // Create a new view
        App.debug('  creating new view');
        v = new type(options);
        this.viewsByType[v.viewLookupKey] = v;
        return v;
    },
    showViews: function (views) {
        var that = this;
        newIds = _.pluck(views, 'cid');
        oldIds = _.pluck(this.views, 'cid');
        App.debug('New view ids:');
        App.debug(newIds);
        App.debug('Old view ids:');
        App.debug(oldIds);
        newViews = [];
        // Determine whether to keep old views
        _.each(this.views, function (oldView) {
            if (_.contains(newIds, oldView.cid)) {
                // Keep the view
                newViews.push(oldView);
            } else {
                // Remove the view
                App.debug('Cleaning up view: ' + oldView.cid);
                if (oldView.close) {
                    oldView.close();
                }
                oldView.remove();
                delete that.viewsByType[oldView.viewLookupKey];
                delete that.viewMap[oldView.cid];
            }
        });
        // Add new views that doen't already exist
        _.each(views, function (newView) {
            if (!_.contains(oldIds, newView.cid)) {
                App.debug('Attaching view: ' + newView.cid);
                newViews.push(newView);
                that.viewMap[newView.cid] = newView;
            }
        });
        // Replace active view list
        $('.content').html();
        this.views = newViews;
        _.each(this.views, function (v) {
            $('.content').append(v.el);
        })
    },
    showView: function (view) {
        App.debug('Showing view: ' + view.cid)
        this.showViews([view]);
    },
    addView: function (view) {
        App.debug('Adding view: ' + view.cid);
        if (!this.viewMap[view.cid]) {
            this.views.push(view);
            this.viewMap[view.cid] = view;
        }
        $('.content').append(view.el);
    }
};
