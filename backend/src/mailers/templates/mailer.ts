import { hashPassword } from '../../common/utils/bcrypt';
import { config } from '../../config/app.config';
import { resend } from './resendClient';


type Params = {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    from?: string;
}

const mailer_sender = 
config.NODE_ENV === 'production'
 ? `no-reply <onbroading@resend.dev>`
 : `no-reply <${config.MAILER_SENDER}>`;

 export const sendEmail = async ({ to, subject, text, html, from = mailer_sender }: Params) =>
    await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
    })