/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const IllegalModelException = require('./illegalmodelexception');
const Globalize = require('../globalize');

/**
 * Create metamodel for a field
 * @param {object} ast - the AST for the field
 * @return {object} the metamodel for this field
 */
function fieldToMetaModel(ast) {
    const field = {};

    // Field name
    field.name = ast.id.name;
    // Is it an array?
    if (ast.array) {
        field.isArray = true;
    } else {
        field.isArray = false;
    }
    // Is it an optional?
    if (ast.optional) {
        field.isOptional = true;
    } else {
        field.isOptional = false;
    }
    // XXX Can it be missing?
    const type = ast.propertyType.name;
    switch (type) {
    case 'Integer':
        field.$class = 'concerto.metamodel.IntegerFieldDeclaration';
        break;
    case 'Long':
        field.$class = 'concerto.metamodel.LongFieldDeclaration';
        break;
    case 'Double':
        field.$class = 'concerto.metamodel.DoubleFieldDeclaration';
        break;
    case 'Boolean':
        field.$class = 'concerto.metamodel.BooleanFieldDeclaration';
        break;
    case 'DateTime':
        field.$class = 'concerto.metamodel.DateTimeFieldDeclaration';
        break;
    case 'String':
        field.$class = 'concerto.metamodel.StringFieldDeclaration';
        break;
    default:
        field.$class = 'concerto.metamodel.ObjectFieldDeclaration';
        field.type = {
            $class: 'concerto.metamodel.TypeIdentifier',
            name: type
        };
        break;
    }

    return field;
}

/**
 * Create metamodel for a relationship
 * @param {object} ast - the AST for the relationtion
 * @return {object} the metamodel for this relationship
 */
function relationshipToMetaModel(ast) {
    let relationship = {
        $class: 'concerto.metamodel.RelationshipDeclaration',
        type: {
            $class: 'concerto.metamodel.TypeIdentifier',
            name: ast.propertyType.name
        },
    };

    // Field name
    relationship.name = ast.id.name;
    // Is it an array?
    if (ast.array) {
        relationship.isArray = true;
    } else {
        relationship.isArray = false;
    }
    // Is it an optional?
    if (ast.optional) {
        relationship.isOptional = true;
    } else {
        relationship.isOptional = false;
    }

    return relationship;
}

/**
 * Create metamodel for an enum field
 * @param {object} ast - the AST for the enum field
 * @return {object} the metamodel for this enum field
 */
function enumPropertyToMetaModel(ast) {
    let property = {
        $class: 'concerto.metamodel.EnumFieldDeclaration',
    };

    // Field name
    property.name = ast.id.name;
    // Is it an array?
    property.isArray = false;
    // Is it an optional?
    property.isOptional = false;

    return property;
}

/**
 * Create metamodel for a class declaration
 * @param {object} ast - the AST for the declaration
 * @return {object} the metamodel for this declaration
 */
function declToMetaModel(ast) {
    let decl = {};

    if(ast.type === 'AssetDeclaration') {
        decl.$class = 'concerto.metamodel.AssetDeclaration';
    } else if(ast.type === 'TransactionDeclaration') {
        decl.$class = 'concerto.metamodel.TransactionDeclaration';
    } else if(ast.type === 'EventDeclaration') {
        decl.$class = 'concerto.metamodel.EventDeclaration';
    } else if(ast.type === 'ParticipantDeclaration') {
        decl.$class = 'concerto.metamodel.ParticipantDeclaration';
    } else if(ast.type === 'EnumDeclaration') {
        decl.$class = 'concerto.metamodel.EnumDeclaration';
    } else if(ast.type === 'ConceptDeclaration') {
        decl.$class = 'concerto.metamodel.ConceptDeclaration';
    } else {
        let formatter = Globalize('en').messageFormatter('modelfile-constructor-unrecmodelelem');

        throw new IllegalModelException(formatter({
            'type': ast.type,
        }), this);
    }

    // The class name
    decl.name = ast.id.name;

    // Is the class abstract?
    if (ast.abstract) {
        decl.isAbstract = true;
    } else {
        decl.isAbstract = false;
    }

    // Super type
    if (ast.classExtension) {
        decl.superType = {
            $class: 'concerto.metamodel.TypeIdentifier',
            name: ast.classExtension.class.name
        };
    }

    // Is the class idenfitied by a field
    if (ast.idField) {
        decl.identifiedByField = ast.idField.name;
    }

    // Class fields
    decl.fields = [];
    for (let n = 0; n < ast.body.declarations.length; n++) {
        let thing = ast.body.declarations[n];

        if(thing.id && thing.id.name && thing.id.name.startsWith('$')) {
            throw new IllegalModelException(`Invalid field name ${thing.id.name}`, this.modelFile, thing.location);
        }

        if (thing.type === 'FieldDeclaration') {
            decl.fields.push(fieldToMetaModel(thing));
        } else if (thing.type === 'RelationshipDeclaration') {
            decl.fields.push(relationshipToMetaModel(thing));
        } else if (thing.type === 'EnumPropertyDeclaration') {
            decl.fields.push(enumPropertyToMetaModel(thing));
        } else {
            let formatter = Globalize.messageFormatter('classdeclaration-process-unrecmodelelem');
            throw new IllegalModelException(formatter({
                'type': thing.type
            }), this.modelFile, thing.location);
        }
    }

    return decl;
}

/**
 * Export metamodel
 * @param {object} ast - the AST for the model
 * @return {object} the metamodel for this model
 */
function astToMetaModel(ast) {
    const metamodel = {
        $class: 'concerto.metamodel.ModelFile'
    };
    metamodel.namespace = ast.namespace;

    if(ast.imports) {
        metamodel.imports = [];
        ast.imports.forEach((imp) => {
            const ns = {
                $class: 'concerto.metamodel.NamespaceImport'
            };
            ns.namespace = imp.namespace;
            if(imp.uri) {
                ns.uri = imp.uri;
            }
            metamodel.imports.push(ns);
        });
    }

    if (ast.body.length > 0) {
        metamodel.declarations = [];
    }
    for(let n=0; n < ast.body.length; n++ ) {
        const thing = ast.body[n];
        const decl = declToMetaModel(thing);
        metamodel.declarations.push(decl);
    }
    return metamodel;
}

module.exports = {
    astToMetaModel,
};
