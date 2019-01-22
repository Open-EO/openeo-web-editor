/**
 * Manage one block meta
 */
var Meta = function(meta)
{
    this.name = meta.name;
    this.fields = [];
    this.generate = meta.generate;

    // Importing fields meta data
    if ('fields' in meta) {
        for (var k in meta.fields) {
            var field = meta.fields[k];
            var attributes = ('attrs' in field ? field.attrs.split(' ') : []);
            field.attrs = {};
            for (var i in attributes) {
                field.attrs[attributes[i]] = true;
            }
            this.fields.push(field);
        }
    }

    // Adding module
    if ('module' in meta) {
        this.module = meta.module;
    } else {
        this.module = null;
    }
}

export default Meta;