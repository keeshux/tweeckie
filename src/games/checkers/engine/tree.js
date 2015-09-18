    // [MODULE]: capture tree

    /**
     * @constructor
     */
    function Tree() {
        this.root = new TreeNode(null);
    }

    Tree.prototype.clear = function() {
        this.root.children = null;
    };

    Tree.prototype.isEmpty = function() {
        return !this.root.hasChildren();
    };

    Tree.prototype.put = function(item) {
        this.root.put(item, 0);
    };

    // for debugging
    Tree.prototype.dfs = function() {
        var v = [];
        this.root.visit(v);
        return v.join(' - ');
    };

    /**
     * @constructor
     */
    function TreeNode(cell) {
        this.cell = cell;
        this.children = null; // null by default (save memory)
        this.captured = null; // cell captured along the way
    }

    TreeNode.prototype.hasChildren = function() {
        return (this.children !== null) && (this.children.length > 0);
    };

    TreeNode.prototype.put = function(item, i) {

        // leaf
        if (i == item.path.length) {
            return;
        }

        // inner node
        var c = item.path[i];
        var child = this.find(c);
        if (!child) {
            child = new TreeNode(c);
            if (i > 0) {
                child.captured = item.capture[i - 1];
            }
            if (this.children === null) {
                this.children = [child];
            } else {
                this.children.push(child);
            }
        }

        // recurse
        child.put(item, i + 1);
    };

    TreeNode.prototype.find = function(c) {
        if (this.children !== null) {
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                if (child.cell == c) {
                    return child;
                }
            }
        }
        return null;
    };

    TreeNode.prototype.visit = function(v) {
        if (this.cell) {
            var str = this.cell;
            if (this.captured) {
                str += ['(', this.captured, ')'].join('');
            }
            v.push(str);
        }
        if (this.children !== null) {
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                child.visit(v);
            }
        }
    };

