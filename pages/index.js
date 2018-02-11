import React from 'react';
import axios from 'axios';
import _find from 'lodash.find';
import _size from 'lodash.size';
import Drawer from 'react-motion-drawer';

import Head from '../components/head';
import Fonts from '../utils/font-observer';
import StockItem from '../components/stock-item';
import NewsItem from '../components/news-item';
import stylesIndex from '../styles/index';

const drawerProps = {
  overlayColor: 'rgba(0, 0, 0, 0.6)',
  drawerStyle: {
    background: '#F9F9F9',
    margin: 0,
    boxShadow: 'rgba(0, 0, 0, 0.188235) 0px 10px 20px, rgba(0, 0, 0, 0.227451) 0px 6px 6px',
  },
};

export default class extends React.Component {
  constructor() {
    super();

    this.state = {
      drawerOpen: false,
      news: {
        articles: [],
        symbol: '',
      },
    };
  }

  componentDidMount() {
    Fonts();
  }

  static async getInitialProps({ req }) {
    try {
      const getData = (direction) => {
        try {
          return new Promise(async (resolve, reject) => {
            const moversResp = await axios.get(`https://api.robinhood.com/midlands/movers/sp500/?direction=${direction}`);
            const moversRespData = moversResp.data.results;

            const moversSymbols = moversRespData
              .map((item) => {
                return item.symbol;
              })
              .join(',');

            const moversQuotes = await axios.get(`https://api.robinhood.com/quotes/?symbols=${moversSymbols}`);
            const currentQuotes = await axios.get(
              `https://api.iextrading.com/1.0/stock/market/batch?symbols=${moversSymbols}&types=quote`
            );

            const movers = await Promise.all(
              moversRespData.map(async (item) => {
                const quote = _find(moversQuotes.data.results, { symbol: item.symbol });
                const currentQuote = currentQuotes.data[item.symbol].quote;
                // const newsResp = await axios.get(`https://api.iextrading.com/1.0/stock/${item.symbol}/news`);

                return {
                  symbol: item.symbol,
                  last_pct: item.price_movement.market_hours_last_movement_pct,
                  last_price: item.price_movement.market_hours_last_price,
                  quote: quote,
                  currentQuote,
                };
              })
            );

            resolve(movers);
          });
        } catch (e) {
          console.error('inside getdata', e);
        }
      };

      const movingUp = await getData('up');
      const movingDown = await getData('down');

      return {
        movingUp: movingUp,
        movingDown: movingDown,
        drawerOpen: false,
      };
    } catch (e) {
      console.log('Error during getting data!');
      console.log(e.code);
      return {
        movingUp: [], //movingUp,
        movingDown: [], //movingDown,
      };
    }
  }

  toggleNews = async (symbol) => {
    if (symbol === this.state.news.symbol) {
      console.log('it is true!!!!!');
      this.setState({ drawerOpen: true });
      return;
    }
    const newsResp = await axios.get(`https://api.iextrading.com/1.0/stock/${symbol}/news`);

    this.setState({
      drawerOpen: true,
      news: {
        articles: newsResp.data,
        symbol,
      },
    });
  };

  render() {
    const moversUpList = this.props.movingUp.map((stock) => {
      return <StockItem key={stock.symbol} stock={stock} direction={'up'} toggleNews={this.toggleNews} />;
    });

    const moversDownList = this.props.movingDown.map((stock) => {
      return <StockItem key={stock.symbol} stock={stock} direction={'down'} toggleNews={this.toggleNews} />;
    });

    return (
      <div>
        <Head title="Stock Movers" />
        <style jsx global>{`
          :global(body) {
            overflow: hidden;
            margin: 0;
            font-family: 'Work Sans', sans-serif;
            background-color: #f7f6ed;
          }

          ul {
            list-style-type: none;
            padding-left: 0;
            position: relative;
          }

          a {
            color: #7b1569;
          }
        `}</style>
        <style jsx>{stylesIndex}</style>
        <article className="c">
          <div className="row">
            <section className="6 col">
              <h2>Movers Up</h2>
              <div>
                <ul>{moversUpList}</ul>
              </div>
            </section>

            <section className="6 col">
              <h2>Movers Down</h2>
              <div>
                <ul>{moversDownList}</ul>
              </div>
            </section>
          </div>
        </article>
        <Drawer
          {...drawerProps}
          right={true}
          fadeOut={true}
          width={500}
          open={this.state.drawerOpen}
          onChange={(open) => this.setState({ drawerOpen: open })}
        >
          <ul className="news-articles">
            {_size(this.state.news.articles) &&
              this.state.news.articles.map((article) => <NewsItem key={article.headline} article={article} />)}
          </ul>
        </Drawer>
      </div>
    );
  }
}
