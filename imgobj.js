var fs = require('fs')
var PNG = require('pngjs').PNG;

// Don't touch this

function getRgbArray(filename, fxn) {
    return fs.createReadStream(filename)
        .pipe(new PNG({ filterType: 4 }))
        .on('parsed', function()
        {
            var rgbs = []
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var idx = (this.width * y + x) << 2;
                    rgbs[rgbs.length] = [
                        this.data[idx],
                        this.data[idx+1],
                        this.data[idx+2]
                    ]
                }
            }
            fxn(rgbs)
        })
}

// Example
// Delete this once you get the picture



// But don't delete this line down here

module.exports = getRgbArray