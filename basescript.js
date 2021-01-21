const contentful = require('contentful-management')
const env = require('./enviroment/enviroment.json');
const request = require('request');
const tools = require('./tools.js')

const client = contentful.createClient({
    accessToken: env.contenful.contentDeliveryKey1,
    
})

function requestData() {
    return new Promise((resolve, reject) => {
        request('https://fakestoreapi.com/products/', { json: true }, (err, res) => {
            if (err) { reject(err) }
            resolve(res.body);
        });
    })
}

async function createAsset(enviroment, data) {
    let name = tools.randomString(10)
    let asset = await enviroment.createAsset({
        fields: {
            title: {
                'en-US': name
            },
            description: {
                'en-US': data.title
            },
            file: {
                'en-US': {
                    contentType: 'image/jpeg',
                    fileName: name + '.jpg',
                    upload: data.image
                }
            }
        }
    })
    // console.log(asset)
    return asset
}

function parseDataToContentProduct(rawData) {
    return rawData.map(data => (
        {
            fields: {
                name: {
                    "en-US": data.title
                },
                sku: {
                    "en-US": tools.randomString(10)
                },
                description: {
                    "en-US": data.description
                },
                image: {
                    "en-US": {
                        "sys": { "type": "Link", "linkType": "Asset", "id": data.imageId }
                    }
                },
                price: {
                    "en-US": parseFloat(data.price)
                },
                discountPercent: {
                    "en-US": 0.2
                },
                features: {
                    "en-US": "nothing"
                },
                rating: {
                    "en-US": Math.floor(1 + Math.random() * 5)
                }
            }
        }
    ))
}

async function getImagesId(enviroment, data) {
    for (let el of data) {
        let asset = await createAsset(enviroment, el);
        el["imageId"] = asset.sys.id;
        let processedAsset = await asset.processForAllLocales(); // !!
        await processedAsset.publish();
    }
    return data;
}

async function setEntry() {
    try {
        let res = await client.getSpace(env.contenful.space.id);
        let envivoment = await res.getEnvironment('master');

        let data = await requestData();
        let newData = await getImagesId(envivoment, data);
        let parseData = parseDataToContentProduct(newData);
        // console.log(JSON.stringify(parseData));

        for (let el of parseData) {
            await (await envivoment.createEntry('product', el)).publish();
        }


    } catch (error) {
        console.log(error)
    }
}

async function getEntrys() {
    let res = await client.getSpace(env.contenful.space.id);
    let envivoment = await res.getEnvironment('master');
    let entries = await envivoment.getEntries();
    console.log(JSON.stringify(entries.items[0].fields));

}


// getEntrys();
setEntry();
