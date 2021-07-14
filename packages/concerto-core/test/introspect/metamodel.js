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

const ModelManager = require('../../lib/modelmanager');
const ModelFile = require('../../lib/introspect/modelfile');
const fs = require('fs');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe.only('MetaModel', () => {
    const personModel = fs.readFileSync(path.resolve(__dirname, '../data/model/person.cto'), 'utf8');
    const personMetaModel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/model/person.json'), 'utf8'));
    let modelManager;

    beforeEach(() => {
        modelManager = new ModelManager();
    });

    describe('#toMetaModel', () => {

        it('should convert CTO file to its metamodel', () => {
            let mf = new ModelFile(modelManager, personModel);
            const result = mf.toMetaModel();
            result.should.deep.equal(personMetaModel);
        });
    });
});
