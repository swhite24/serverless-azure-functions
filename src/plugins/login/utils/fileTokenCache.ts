/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import _ from "lodash";
import fs from "fs";
import os from "os";
import path from "path";
import { FileTokenStorage } from "./fileTokenStorage";

// var FileTokenStorage = require("./fileTokenStorage");
/**
 * Constructs a new token cache that works with adal-node.
 * @constructor
 * @param {string} filePath - the file path to the token store.
 */
export class FileTokenCache{
  public entries: any;
  public tokenStorage: FileTokenStorage;// = new FileTokenStorage(filePath);

  public constructor(){
    this.tokenStorage = new FileTokenStorage();
  }

  /**
  * Load the cache entries. Does a lazy load,
  * loads from OS on first request, otherwise
  * returns in-memory copy.
  *
  * @param {function(err, Array)} callback callback
  *                               receiving cache entries.
  */
  private _loadEntries(callback) {
    var self = this;
    if (self.entries !== null) {
      return callback(null, self.entries);
    }
    
    self.tokenStorage.loadEntries(function (err, entries) {
      if (!err) {
        self.entries = entries;
      }
      self._normalizeUserId(entries);
      callback(err, entries);
    });
  }

  private _normalizeUserId(entries) {
    entries.forEach(function (entry) {
      if (entry.userId) {
        entry.userId = entry.userId.toLowerCase();
      }
    });
  }

  /**
   * Removes a collection of entries from the cache in a single batch operation.
   * @param  {Array}   entries  An array of cache entries to remove.
   * @param  {Function} callback This function is called when the operation is complete.  Any error is provided as the
   *                             first parameter.
   */
  public remove(entries, callback) {
    var self = this;
    
    self._normalizeUserId(entries);

    function shouldKeep(entry) {
      if (_.find(entries, entry)) {
        return "false";
      }
      return "true";
    }

    self._loadEntries(function (err, _entries) {
      if (err) { return callback(err); }

      var grouped = _.groupBy(_entries, shouldKeep);
      var entriesToRemove = grouped["false"] || [];
      var entriesToKeep = grouped["true"] || [];
      
      self.tokenStorage.removeEntries(entriesToRemove, entriesToKeep, function (err) {
        if (!err) {
          self.entries = entriesToKeep;
        }
        callback(err);
      });
    });
  }

  /**
   * Clears a collection of entries from the cache in a single batch operation.
   * @param  {Function} callback This function is called when the operation is complete.  Any error is provided as the
   *                             first parameter.
   */
  public clear(callback) {
    this.tokenStorage.clear(callback);
  }

  /**
   * Adds a collection of entries to the cache in a single batch operation.
   * @param {Array}   entries  An array of entries to add to the cache.
   * @param  {Function} callback This function is called when the operation is complete.  Any error is provided as the
   *                             first parameter.
   */
  public add(entries, callback) {
    var self = this;

    self._normalizeUserId(entries);
    self._loadEntries(function (err, _entries) {
      if (err) { return callback(err); }

      // Remove any entries that are duplicates of the existing
      // cache elements.
      _.each(_entries, function(element) {
        _.each(entries, function(addElement, index) {
          if (_.isEqual(element, addElement)) {
            entries[index] = null;
          }
        });
      });

      // Add the new entries to the end of the cache.
      entries = _.compact(entries);
      
      self.tokenStorage.addEntries(entries, self.entries, function (err) {
        if (!err) {
          entries.forEach(function (entry) {
            self.entries.push(entry);
          });
        }
        callback(err);
      });
    });
  }

  /**
   * Finds all entries in the cache that match all of the passed in values.
   * @param  {object}   query    This object will be compared to each entry in the cache.  Any entries that
   *                             match all of the values in this object will be returned.  All the values
   *                             in the passed in object must match values in a potentialy returned object
   *                             exactly.  The returned object may have more values than the passed in query
   *                             object.
   * @param  {TokenCacheFindCallback} callback
   */
  public find(query, callback) {
    var self = this;

    self._normalizeUserId([query]);
    self._loadEntries(function (err, _entries) {
      if (err) { return callback(err); }

      var results = _.filter(_entries, query);
      callback(null, results);
    });
  }
}

const CONFIG_DIRECTORY = path.join(os.homedir(), ".azure");
const SLS_TOKEN_FILE = path.join(CONFIG_DIRECTORY, "slsTokenCache.json");

_.extend(FileTokenCache.prototype, {
  
});

// function homeFolder() {
//   if (process.env.HOME !== undefined) {
//     return process.env.HOME;
//   }
  
//   if (process.env.HOMEDRIVE && process.env.HOMEPATH) {
//     return process.env.HOMEDRIVE + process.env.HOMEPATH;
//   }
  
//   throw new Error("No HOME path available");
// }

function getTokenFilePath() {
  // var dir = path.join(homeFolder(), ".azure");
  
  if (!exports.pathExistsSync(CONFIG_DIRECTORY)) {
    fs.mkdirSync(CONFIG_DIRECTORY, 502); // 0766
  }
  
  return CONFIG_DIRECTORY;
}


// module.exports = FileTokenCache;