if(!module)
    module = {};


module.exports = {
    sleep: async function (num) {
        return new Promise(function (resolve) {
            setTimeout(resolve, num);
        });
    }
}