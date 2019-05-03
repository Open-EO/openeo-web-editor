/**
 * A metaField field
 */
var Field = function(metaField)
{
    this.meta = metaField;

    // Setting attributes
    this.attrs = metaField.attrs;

    // Getting type
    if (typeof this.meta.schema.type == 'undefined') {
        this.type = 'string';
    } else if (Array.isArray(this.meta.schema.type) && this.meta.schema.type.length > 0) {
        this.type = this.meta.schema.type[0] === 'null' ? this.meta.schema.type[1] : this.meta.schema.type[0];
    } else {
        this.type = this.meta.schema.type ? this.meta.schema.type : 'any';
    }

    this.isArray = false;
    var s = this.meta.schema;
    if (s.type === 'array' || (Array.isArray(s.type) && s.type.includes('array'))) {
        this.isArray = true;
        this.type = typeof s.items === 'object' ? s.items.type : 'any';
    }

    // Cardinalities
    this.card = 'card' in metaField ? metaField.card : '*';
    this.card = this.parseCardinality(this.card, this.attrs == 'output');

    // Field name
    this.name = metaField.name.toLowerCase();

    this.label = metaField.name;

    // Choices
    this.choices = 'enum' in metaField.schema ? metaField.schema.enum : null;

    // Value
    this.hasValue = false;
    if ('default' in this.meta.schema) {
        this.value = this.meta.schema.default;
        this.hasValue = true;
    }
    else if (this.isArray) {
        this.value = [];
    }
    else if (this.type === 'string') {
        this.value = "";
    }
    else if (this.type === 'integer' || this.type === 'number') {
        this.value = 0;
    }
    else if (this.type === 'boolean') {
        this.value = false;
    }
    else {
        this.value = null;
    }
};

Field.prototype.isEnum = function() {
    return this.type == 'choice' || this.choices;
}

Field.prototype.getEnumChoices = function() {
    return this.choices;
}

Field.prototype.isEditable = function() {
    return this.attrs !== 'output' && this.meta.schema.format !== 'raster-cube'; // ToDo: Take anyOf etc. into account
}

/**
 * Return the (value) HTML rendering
 */
Field.prototype.getValue = function()
{
    return this.value;
};

/**
 * Getting the label
 */
Field.prototype.getLabel = function()
{
    return this.label;
};

/**
 * Setting the value of the field
 */
Field.prototype.setValue = function(value)
{
    if (this.type == 'boolean') {
        value = !!value;
    }

    this.value = value;
    this.hasValue = true;
};

/**
 * Parses the cardinality
 */
Field.prototype.parseCardinality = function(ioCard, isOutput)
{
    var card = [0, 1];

    if (isOutput) {
        card = [0, '*'];
    }

    if (ioCard != undefined) {
        if (typeof(ioCard) != 'string') {
            card = [0, ioCard];
        } else {
            var tab = ioCard.split('-');
            if (tab.length == 1) {
                card = [0, tab[0]];
            } else {
                card = tab;
            }
        }
    }

    for (var idx in card) {
        if (card[idx] != '*') {
            card[idx] = parseInt(card[idx]);
        }
    }

    return card;
};

export default Field;