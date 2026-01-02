import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'First Principles Learning',
    emoji: '🧠',
    description: (
      <>
        Understand <strong>why</strong> before <strong>how</strong>. Every concept is 
        explained from the ground up using the "Hard Parts" methodology. 
        No black boxes — you'll truly understand AI systems.
      </>
    ),
  },
  {
    title: '16 Comprehensive Modules',
    emoji: '📚',
    description: (
      <>
        From Linux basics to production Kubernetes deployment. 
        Cover LLM APIs, RAG systems, LangGraph agents, and complete 
        cloud infrastructure with hands-on projects.
      </>
    ),
  },
  {
    title: 'Production Ready',
    emoji: '🚀',
    description: (
      <>
        Build real applications, not toy examples. Learn Docker, FastAPI, 
        AWS deployment, CI/CD pipelines, security, monitoring, 
        and optimization for production AI systems.
      </>
    ),
  },
  {
    title: '400+ Lessons',
    emoji: '📖',
    description: (
      <>
        Extensive curriculum with step-by-step guidance. 
        Each lesson includes diagrams, code examples, 
        practice exercises, and Q&A sections.
      </>
    ),
  },
  {
    title: 'Interactive Diagrams',
    emoji: '📊',
    description: (
      <>
        2,700+ Mermaid diagrams help you visualize complex concepts. 
        See data flows, architecture patterns, and system interactions 
        clearly illustrated.
      </>
    ),
  },
  {
    title: 'Open Source',
    emoji: '💡',
    description: (
      <>
        Completely free and open source. Learn at your own pace, 
        contribute improvements, and join a community of 
        AI developers learning together.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <span style={{fontSize: '4rem'}}>{emoji}</span>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className="text--center margin-bottom--lg">
          Why This Course?
        </Heading>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
