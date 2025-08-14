module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    let modified = false;

    // Find the variable declarator for 'BELLS'
    const bellsDeclarator = root.find(j.VariableDeclarator, {
        id: { name: 'BELLS' },
    });

    // Within that declarator, find all object properties that have a string value
    bellsDeclarator.find(j.Property, {
        value: {
            type: (type) => type === 'StringLiteral' || type === 'Literal',
        }
    }).forEach(path => {
        // Ensure we are not replacing an already-elided placeholder
        if (typeof path.node.value.value === 'string' && !path.node.value.value.startsWith('[ELIDED')) {
            // Replace the property's value with a placeholder literal
            path.get('value').replace(j.literal('[ELIDED BASE64 DATA]'));
            modified = true;
        }
    });

    // Return the modified source only if changes were made.
    // This is the standard practice for jscodeshift to correctly report "ok" vs "unmodified".
    return modified ? root.toSource({ quote: 'single' }) : null;
};
