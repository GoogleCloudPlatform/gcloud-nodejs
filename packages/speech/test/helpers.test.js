/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var sinon = require('sinon');
var stream = require('stream');

var Speech = require('../');


describe('Speech helper methods', () => {
  var sandbox = sinon.sandbox.create();

  afterEach(() => {
    sandbox.restore();
  });

  describe('streamingRecognize', () => {
    it('writes the config to the resulting stream', () => {
      var speech = Speech.v1();

      // Stub the underlying _streamingRecognize method to just return
      // a bogus stream.
      var writable = stream.Writable();
      var write = sandbox.stub(writable, 'write');
      var sr = sandbox.stub(speech, '_streamingRecognize').returns(writable);

      // Call the new helper method and establish that the config was
      // forwarded as expected.
      var config = {config: {languageCode: 'en-us'}};
      var options = {timeout: Infinity};
      var answer = speech.streamingRecognize(config, options);

      // Establish that the underlying streamingRecognize was called with
      // the options.
      sr.once().withExactArgs(options);
      write.once().withExactArgs({streamingConfig: config});
    });
  });
});
