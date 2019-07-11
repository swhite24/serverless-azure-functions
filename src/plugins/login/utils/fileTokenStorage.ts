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
import path from "path";
import os from "os";


const CONFIG_DIRECTORY = path.join(os.homedir(), ".azure");
const SLS_TOKEN_FILE = path.join(CONFIG_DIRECTORY, "slsTokenCache.json");
export class FileTokenStorage {

  // this._setFile(filename);
  //this._filename = filename;
  public fileName: string;

  public constructor(){
    this.fileName = SLS_TOKEN_FILE;
  }

  private _save(entries, done): void  {
    var writeOptions = {
      encoding: "utf8",
      mode: 384, // Permission 0600 - owner read/write, nobody else has access
      flag: "w"
    };
    
    fs.writeFile(this.fileName, JSON.stringify(entries), writeOptions, done);
  }
  
  private _setFile(filename: string) {
    if (!fs.existsSync(filename)) {
      var dirname = path.dirname(filename);
      //create the directory if it does not exist
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname);
      }
      fs.writeFileSync(filename, JSON.stringify([]));
    }
    this.fileName = filename;
  }
  
  public loadEntries(callback: Function) {
    var entries = [];
    var err;
    try {
      var content = fs.readFileSync(this.fileName);
      entries = JSON.parse(content.toString());
      entries.forEach(function (entry) {
        entry.expiresOn = new Date(entry.expiresOn);
      });
    } catch (ex) {
      if (ex.code !== "ENOENT") {
        err = ex;
      }
    }
    callback(err, entries);
  }
  
  public removeEntries(entriesToRemove, entriesToKeep, callback) {
    this._save(entriesToKeep, callback);
  }
  
  public addEntries(newEntries, existingEntries, callback) {
    var entries = existingEntries.concat(newEntries);
    this._save(entries, callback);
  }

  public clear(callback) {   
    this._save([], callback); 
  }
}

// module.exports = FileTokenStorage;