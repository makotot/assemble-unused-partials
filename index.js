var fs = require('fs');

var Promise = require('promise'),
  chalk = require('chalk'),
  figures = require('figures');

var findPartials = require('find-assemble-partials'),
  getPartials = require('get-assemble-partials'),
  getLayouts = require('get-assemble-layouts'),
  getPages = require('get-assemble-pages'),
  getPartialName = require('get-assemble-partial-name'),
  getPartialPath = require('get-assemble-partial-path');


function flatten (items) {
  return Array.prototype.concat.apply([], items);
}


module.exports = function (params, cb) {

  var getLayoutsAll = new Promise(function (resolve, reject) {
    getLayouts(params, function (err, layouts) {
      if (err) {
        reject(err);
      }

      Promise
        .all(layouts.map(function (layout) {

          return new Promise(function (innerResolve, innerReject) {
            fs.readFile(layout, 'utf8', function (error, data) {
              if (error) {
                innerReject(error);
              }

              innerResolve(findPartials(data));
            });
          });
        }))
        .then(function (res) {
          resolve({
            layouts: layouts,
            partialNames: flatten(res)
          });
        });
    });
  });

  var getPartialsAll = new Promise(function (resolve, reject) {
    getPartials(params, function (err, partials) {
      if (err) {
        reject(err);
      }

      Promise
        .all(partials.map(function (partial) {

          return new Promise(function (innerResolve, innerReject) {
            fs.readFile(partial, 'utf8', function (error, data) {
              if (error) {
                innerReject(error);
              }

              innerResolve(findPartials(data));
            });
          });
        }))
        .then(function (res) {
          resolve({
            partials: partials,
            partialNames: flatten(res)
          });
        });

    });
  });

  var getPagesAll = new Promise(function (resolve, reject) {
    getPages(params, function (err, pages) {
      if (err) {
        reject(err);
      }

      Promise
        .all(pages.map(function (page) {
          return new Promise(function (innerResolve, innerReject) {
            fs.readFile(page, 'utf8', function (error, data) {
              if (error) {
                innerReject(error);
              }

              innerResolve(findPartials(data));
            });
          });
        }))
        .then(function (res) {
          resolve({
            pages: pages,
            partialNames: flatten(res)
          });
        });

    });
  });

  var filterUnusedPartials = function (partials, usedPartialNames, done) {

    var partialNames = partials.map(function (partial) {
      return getPartialName(partial);
    });

    var unused = partialNames.filter(function (partial, idx) {
      return usedPartialNames.every(function (used) {
        return used !== partial;
      });
    });

    done(null, unused);
  };


  var getUnusedPartials = function (res, done) {
    var partials = res[1].partials,
      flattenPartialNames = flatten(res.map(function (item) {
        return item.partialNames;
      }));

    var usedPartialNames = flattenPartialNames.filter(function (item, idx) {
      return flattenPartialNames.indexOf(item) === idx;
    });

    filterUnusedPartials(partials, usedPartialNames, function (err, unused) {
      if (!unused.length) {
        done();
        return;
      }

      Promise
        .all(unused.map(function (name) {
          return new Promise(function (resolve, reject) {
            getPartialPath(params, name, function (error, data) {
              if (error) {
                reject(error);
                return;
              }
              resolve(data);
            });
          });
        }))
        .then(function (unusedPartials) {
          console.log();
          console.log(chalk.yellow.bold(figures.pointer + ' Unused partials'));

          unusedPartials.forEach(function (partial) {
            console.log(' ' + figures.warning + ' ' + partial);
          });

          done();
        });

    });
  };


  Promise
    .all([
      getLayoutsAll,
      getPartialsAll,
      getPagesAll
    ])
    .then(function (res) {
      getUnusedPartials(res, cb);
    });
};


module.exports.options = {
  stage: 'render:post:pages'
};

