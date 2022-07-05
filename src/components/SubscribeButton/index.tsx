import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import { getStripesJs } from '../../services/stripes-js';
import styles from './styles.module.scss'

interface SubscribeButtonProps {
    priceId: string;
}

export function SubscribeButton( { priceId }: SubscribeButtonProps) {

    //const [session]: any = useSession();
    const { data: session} = useSession();
    const router = useRouter();

    async function handleSubscribe() {
        if(!session) {
            signIn('github')
            return;
        }

        if (session.activeSubscription) {
            router.push('/posts')
            return
        }
        //creat checkout session with Stipe
        try {
            const response = await api.post('/subscribe') //o nome do arquivo eh o nome da rota
            const { sessionId } = response.data;
            const stripe = await getStripesJs();
            await stripe.redirectToCheckout({sessionId: sessionId});
        }
        catch (err) {
            alert(err.message)
        }
    }

    return (
        <button 
            type="button" 
            className={styles.subscribeButton}
            onClick={handleSubscribe}
        >
            Subscribe now
        </button>
    )
}