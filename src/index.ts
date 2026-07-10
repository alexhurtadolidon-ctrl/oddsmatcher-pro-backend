import express, { Request, Response } from 'express';
import { chromium, Browser } from 'playwright';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// TIPOS
// ============================================

interface BookmakerOdds {
  bookmaker: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime: string;
  odds: {
    local: number;
    draw: number;
    visitor: number;
  };
  url: string;
}

interface Arbitrage {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime: string;
  backBookmaker: string;
  backOdds: number;
  layBookmaker: string;
  layOdds: number;
  backStake: number;
  layStake: number;
  liability: number;
  profit: number;
  profitPercent: number;
  rating: number;
  scrapedAt: string;
}

// ============================================
// CONFIGURACIÓN DE CASAS ESPAÑOLAS
// ============================================

const BOOKMAKERS_CONFIG = [
  {
    name: 'Codere',
    url: 'https://www.codere.es/es/apuestas-deportivas',
    selectors: {
      matchRow: '[data-testid="event-row"]',
      teams: '[data-testid="team-names"]',
      odds: '[data-testid="odds-button"]',
      time: '[data-testid="event-time"]',
    },
  },
  {
    name: 'Sportium',
    url: 'https://www.sportium.es/es/apuestas-deportivas',
    selectors: {
      matchRow: '[data-testid="event-row"]',
      teams: '[data-testid="team-names"]',
      odds: '[data-testid="odds-button"]',
      time: '[data-testid="event-time"]',
    },
  },
  {
    name: 'Betano',
    url: 'https://www.betano.es/apuestas-deportivas',
    selectors: {
      matchRow: '[data-testid="event-row"]',
      teams: '[data-testid="team-names"]',
      odds: '[data-testid="odds-button"]',
      time: '[data-testid="event-time"]',
    },
  },
  {
    name: 'Kirolbet',
    url: 'https://www.kirolbet.es/es/sports/football/event-list',
    selectors: {
      matchRow: '.event-row',
      teams: '.event-name',
      odds: '.odds-value',
      time: '.event-time',
    },
  },
  {
    name: 'Betfair',
    url: 'https://www.betfair.com/exchange/plus/#/market/home',
    selectors: {
      matchRow: '[data-testid="market-row"]',
      teams: '[data-testid="market-name"]',
      odds: '[data-testid="odds"]',
      time: '[data-testid="market-time"]',
    },
  },
  {
    name: '1xBet',
    url: 'https://1xbet.es/es/apuestas-deportivas/futbol',
    selectors: {
      matchRow: '.match-row',
      teams: '.match-name',
      odds: '.odds-button',
      time: '.match-time',
    },
  },
  {
    name: 'Bet365',
    url: 'https://www.bet365.es/#/AC/B1/C1/D62/E3/F11/',
    selectors: {
      matchRow: '[data-testid="event-row"]',
      teams: '[data-testid="team-names"]',
      odds: '[data-testid="odds"]',
      time: '[data-testid="event-time"]',
    },
  },
  {
    name: 'Betclic',
    url: 'https://www.betclic.es/apuestas-deportivas/futbol',
    selectors: {
      matchRow: '.event-row',
      teams: '.event-title',
      odds: '.odds-value',
      time: '.event-time',
    },
  },
];

// ============================================
// DATOS SIMULADOS (PLACEHOLDER REALISTA)
// ============================================

function generateMockArbitrages(): Arbitrage[] {
  const teams = [
    { home: 'Real Madrid', away: 'Barcelona' },
    { home: 'Atlético Madrid', away: 'Sevilla' },
    { home: 'Valencia', away: 'Villarreal' },
    { home: 'Real Sociedad', away: 'Betis' },
    { home: 'Osasuna', away: 'Celta' },
  ];

  const arbitrages: Arbitrage[] = [];

  teams.forEach((team, idx) => {
    const backOdds = 1.8 + Math.random() * 0.4;
    const layOdds = 1.75 + Math.random() * 0.35;
    const backStake = 100;
    const layStake = (backStake * backOdds) / (layOdds * 0.95);
    const profit = backStake - layStake;
    const rating = ((backOdds - 1) / (layOdds * 0.95 - 1)) * 100;

    arbitrages.push({
      id: `arb-${idx}`,
      homeTeam: team.home,
      awayTeam: team.away,
      league: 'LaLiga',
      kickoffTime: new Date(Date.now() + Math.random() * 86400000).toISOString(),
      backBookmaker: ['Codere', 'Sportium', 'Betano'][Math.floor(Math.random() * 3)],
      backOdds: parseFloat(backOdds.toFixed(2)),
      layBookmaker: 'Betfair',
      layOdds: parseFloat(layOdds.toFixed(2)),
      backStake,
      layStake: Math.round(layStake * 100) / 100,
      liability: Math.round((layStake * (layOdds - 1)) * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercent: Math.round(((profit / (backStake + layStake)) * 100) * 100) / 100,
      rating: Math.round(rating * 100) / 100,
      scrapedAt: new Date().toISOString(),
    });
  });

  return arbitrages.sort((a, b) => b.rating - a.rating);
}

// ============================================
// SCRAPER PLAYWRIGHT
// ============================================

class BookmakerScraper {
  private browser: Browser | null = null;

  async init() {
    console.log('🚀 Iniciando navegador Playwright...');
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-gpu',
      ],
    });
    console.log('✅ Navegador iniciado');
  }

  async scrapeAllBookmakers(): Promise<BookmakerOdds[]> {
    const allMatches: BookmakerOdds[] = [];
    console.log('📍 Scrapeando casas...');
    // Por ahora retornar vacío (Playwright necesita selectors actuales)
    return allMatches;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// ============================================
// CALCULADORA DE ARBITRAJES
// ============================================

function calculateArbitrages(matches: BookmakerOdds[]): Arbitrage[] {
  // Por ahora usar datos simulados
  return generateMockArbitrages();
}

// ============================================
// RUTAS API
// ============================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Oddsmatcher Pro Backend',
  });
});

app.get('/api/arbitrages', async (req: Request, res: Response) => {
  try {
    const minProfit = parseFloat(req.query.minProfit as string) || 0;
    const arbitrages = generateMockArbitrages();
    const filtered = arbitrages.filter((a) => a.profit >= minProfit);

    res.json({
      status: 'success',
      count: filtered.length,
      arbitrages: filtered,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/scrape', async (req: Request, res: Response) => {
  try {
    const arbitrages = generateMockArbitrages();

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      arbitragesFound: arbitrages.length,
      arbitrages: arbitrages.slice(0, 50),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// SERVIDOR
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`\n📍 Endpoints disponibles:`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/scrape - Obtener arbitrajes`);
  console.log(`   GET /api/arbitrages - Solo arbitrajes rentables\n`);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});
