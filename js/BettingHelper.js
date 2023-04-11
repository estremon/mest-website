var token = document.head.querySelector('meta[name="csrf-token"]').content;
var options = {
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': token,
        'Access-Control-Allow-Credentials': true
    }
};
console.log(token,options);
class Bet
{
    constructor(gameId, marketId, ratio, game, template, market, index = '')
    {
        this.gameId = gameId;
        this.game = game;
        this.template = template;
        this.marketId = marketId;
        this.market = market;
        this.ratio = ratio;
        this.index = index;
    }

    setRatio(ratio)
    {
        this.ratio = ratio;
    }

}

class Slip
{
    constructor()
    {
        this.bets = [];
        this.stake = 0;
        this.vipStart = 0;
        this.vipRate = 0.0;
        this.taxRate = 0.0;
        this.ratio = 1.0;
        this.bonus = 0;
        this.tax = 0;
        this.grossAmount = 0;
        this.winAmount = 0;
        this.minStake = 0;
        this.maxStakeSingle = 0;
        this.maxStakeParley = 0;
        this.maxBetsParley = 0;
        this.maxRatio = 0;
        this.maxWinSingle = 0;
        this.maxWinParley = 0;
    }

    setMinStake(stake)
    {
        this.minStake = stake;
    }

    setMaxStakeSingle(stake)
    {
        this.maxStakeSingle = stake;
    }

    setMaxStakeParley(stake)
    {
        this.maxStakeParley = stake;
    }

    setMaxBetsParley(num)
    {
        this.maxBetsParley = num;
    }

    setMaxRatio(ratio)
    {
        this.maxRatio = ratio;
    }

    setVipStart(amount)
    {
        this.vipStart = amount;
    }

    setVipRate(rate)
    {
        this.vipRate = rate / 100;
    }

    setTaxRate(rate)
    {
        this.taxRate = rate / 100;
    }

    setMaxWinSingle(amount)
    {
        this.maxWinSingle = amount;
    }

    setMaxWinParley(amount)
    {
        this.maxWinParley = amount;
    }

    betsCount()
    {
        return this.bets.length;
    }

    addBet(bet)
    {
        if (this.betsCount() < this.maxBetsParley) {
            let oldBet = this.bets.find(b => b.gameId === bet.gameId);
            if (oldBet) {
                return false;
            }
            this.bets.push(bet);
            this.computePayout();
            return true;
        }
        return false;
    }

    removeBet(gameId)
    {
        let index = this.bets.findIndex(b => b.gameId === gameId);
        if (index >= 0) {
            this.bets.splice(index, 1);
            this.computePayout();
            return true;
        }
        return false;
    }

    getBet(gameId)
    {
        let bet = this.bets.find(b => b.gameId === gameId);
        return bet ? bet : null;
    }

    setStake(amount)
    {
        if (this.betsCount() === 0) {
            return false;
        }
        if (amount < this.minStake) {
            toastr.warning('Minimum stake allowed is ' + this.minStake);
            return false;
        }
        if (this.betsCount() === 1 && amount > this.maxStakeSingle) {
            toastr.warning('Maximum stake for single bets is ' + this.maxStakeSingle);
            return false;
        }
        if (this.betsCount() > 1 && amount > this.maxStakeParley) {
            toastr.warning('Maximum stake for multiple bets is ' + this.maxStakeParley);
            return false;
        }
        this.stake = amount;
        this.computePayout();
    }

    computePayout()
    {
        if (this.betsCount() >= 1) {
            let ratio = 1.0;
            this.bets.forEach((bet, index) => {
                ratio *= bet.ratio;
            });
            if (ratio > this.maxRatio) {
                this.ratio = this.maxRatio;
            } else {
                this.ratio = ratio;
            }
            this.ratio = toTwoDecimalLower(this.ratio);
            this.grossAmount = toNearestHundredsLower(this.ratio * this.stake);
            if (this.betsCount() === 1 && this.grossAmount > this.maxWinSingle) {
                this.grossAmount = this.maxWinSingle;
            } else if (this.betsCount() > 1 && this.grossAmount > this.maxWinParley) {
                this.grossAmount = this.maxWinParley;
            }
            if (this.stake >= this.vipStart) {
                this.bonus = toNearestHundredsLower(this.vipRate * this.grossAmount);
            }
            this.tax = toNearestHundredsUpper(this.taxRate * this.grossAmount);
            this.winAmount = this.grossAmount + this.bonus - this.tax;
        } else {
            this.grossAmount = 0;
            this.winAmount = 0;
        }
    }

    clearSlip()
    {
        this.bets = [];
        this.stake = 0;
        this.ratio = 1.0;
        this.bonus = 0;
        this.tax = 0;
        this.winAmount = 0;
        this.computePayout();
    }

    has(gameId)
    {
        let index = this.bets.findIndex(b => b.gameId === gameId);
        return index >= 0;
    }

    //to create a new betting slip
    static create(obj)
    {
        let slip = new Slip();
        for (let prop in obj) {
            if (slip.hasOwnProperty(prop)) {
                slip[prop] = obj[prop];
            }
        }
        return slip;
    }

    placeBet(url, token)
    {
        let slip = deepClone(this);
        slip._token = token;
        //console.log(slip);
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
            'Access-Control-Allow-Credentials': true
        };
        return axios.put(url, slip, {
            headers: headers
        }).then((response) => {
            if (response.statusText === 'OK') {
                return Promise.resolve(response.data);
            }
            throw new Error(response.data);
        }).catch((error) => {
            //console.log(error);
            return Promise.reject(error.response.data);
        });
    }
}

//to round up to nearest hundreds
function toNearestHundredsUpper(num)
{
    return Math.ceil(num / 100) * 100;
}

//to round down to nearest hundreds
function toNearestHundredsLower(num)
{
    return Math.floor(num / 100) * 100;
}

//to round down to two decimal places
function toTwoDecimalLower(num)
{
    return Math.floor(num * 100) / 100;
}

//to round up to two decimal places
function toTwoDecimalUpper(num)
{
    return Math.ceil(num * 100) / 100;
}

function deepClone(obj)
{
    return JSON.parse(JSON.stringify(obj));
}

function handleRequest(url, options)
{
    return fetch(url, options).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw Error(await response.json());
    }).catch((error) => {
        return Promise.reject(error.message);
    });
}

function printOrder(url)
{
    if (window.frames['printFrame']) {
        window.frames['printFrame'].location = url;
    }
}

async function cancelOrder(url)
{
    try {
        $('.cancelBtn').addClass('disabled');

        let isConfirm = await swal({
            title: 'Are you sure?',
            text: "You will cancel this order!",
            icon: 'warning',
            buttons: [
                'No',
                'Yes'
            ],
            closeOnClickOutside: false
        });
        //return;
        if (isConfirm) {
            let response = await axios.patch(url,options);
            await swal({title: response.data, icon: 'success'});
            location.reload();
        }
        $('.cancelBtn').removeClass('disabled');
    } catch (error) {
        console.log(error.response);
        await swal({title: error.response.data, icon: 'error'});
        $('.cancelBtn').removeClass('disabled');
    }
}

function getLatestSales(url, options)
{
    return axios.get(url, options).then((response) => {
        if (response.statusText === 'OK') {
            return Promise.resolve(response.data);
        }
        throw new Error(response.data);
    }).catch((error) => {
        //console.log(error);
        return Promise.reject(error.response.data);
    });
}

function prettyNumber(value, field_id)
{
    console.log(field_id, value);
    let number = numeral(value).value();
    if (number > 0) {
        $(`#${field_id}`).val(numeral(value).format('0,0'));
    }
}

async function uncancelOrder(url)
{
    try {
        $('.uncancelBtn').addClass('disabled');

        let isConfirm = await swal({
            title: 'Are you sure?',
            text: "You will uncancel this order!",
            icon: 'warning',
            buttons: [
                'No',
                'Yes'
            ],
            closeOnClickOutside: false
        });
        //return;
        if (isConfirm) {
            let response = await axios.patch(url,options);
            await swal({title: response.data, icon: 'success'});
            location.reload();
        }
        $('.uncancelBtn').removeClass('disabled');
    } catch (error) {
        console.log(error.response);
        await swal({title: error.response.data, icon: 'error'});
        $('.uncancelBtn').removeClass('disabled');
    }
}

/**
 *
 * @param url
 * @param data
 * @returns {Promise<Response>}
 */
function get(url) {
    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
            'Access-Control-Allow-Credentials': true
        }
    }).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw Error(await response.json());
    }).catch((error) => {
        return Promise.reject(error.message);
    });
}

/**
 *
 * @param url
 * @param data
 * @returns {Promise<Response>}
 */
function post(url, data) {
    return fetch(url, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
            'Access-Control-Allow-Credentials': true
        }
    }).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw Error(await response.json());
    }).catch((error) => {
        return Promise.reject(error.message);
    });
}

/**
 *
 * @param url
 * @param data
 * @returns {Promise<Response>}
 */
function put(url, data) {
    return fetch(url, {
        method: 'PUT',
        body: JSON.stringify(data), // data can be `string` or {object}!
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
            'Access-Control-Allow-Credentials': true
        }
    }).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw Error(await response.json());
    }).catch((error) => {
        return Promise.reject(error.message);
    });
}

/**
 *
 * @param url
 * @param data
 * @returns {Promise<Response>}
 */
function patch(url, data) {
    return fetch(url, {
        method: 'PATCH',
        body: JSON.stringify(data), // data can be `string` or {object}!
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
            'Access-Control-Allow-Credentials': true
        }
    }).then(async (response) => {
        if (response.ok) {
            return response.json();
        }
        throw Error(await response.json());
    }).catch((error) => {
        return Promise.reject(error.message);
    });
}
