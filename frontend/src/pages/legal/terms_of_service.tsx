import React from 'react';
import { config } from '../../utils/config';

export const TermsOfServicePage: React.FC = () => {
    const appDomain = new URL(config.urls.app).hostname;
    const cdnDomain = new URL(config.urls.cdn).hostname;

    return (
        <>
            <h1>Terms of Service</h1>
            <br />
            <section id="definitions">
                <div className="page-header">
                    <h2>1. Legal Definitions</h2>
                </div>
                <p>For the purpose of this document the following legal definitions are to be applied as appropriate</p>
                <ol>
                    <li>"foxCaves" refers to foxcav.es and excludes its shareholders, owners, or operators.</li>
                    <li>
                        "foxCaves Network" refers to any website, product, or service owned and/or operated under the{' '}
                        <strong>{appDomain}</strong> or <strong>{cdnDomain}</strong> domains
                    </li>
                    <li>
                        "Content" refers to any image file that is shared, uploaded, or distributed through the foxCaves
                        Network.
                    </li>
                    <li>
                        "You", "Your" refers to the individual who uploads or has uploaded content to the foxCaves
                        Network.
                    </li>
                </ol>
            </section>
            <section id="cma-disclaimer">
                <div className="page-header">
                    <h2>2. Computer Misuse Act 1990</h2>
                </div>
                <p>
                    Under the Computer Misuse Act, by using any of the foxCaves Network you agree to refrain from
                    performing any illegal activity as listed in Sections 1 through 3 of the act. This includes but is
                    not limited to the following activities:
                </p>
                <ul>
                    <li>
                        Forging any TCP/IP packet header or any part of the header information in any posting, or in any
                        way using the foxCaves Network to send altered, deceptive, or false source-identifying
                        information
                    </li>
                    <li>Interfering with any of the foxCaves Network to cause loss of availability or connectivity</li>
                    <li>Attempt unauthorized access to any server on the foxCaves Network</li>
                </ul>
            </section>
            <section id="liability">
                <div className="page-header">
                    <h2>3. Limitation of Liability</h2>
                </div>
                <p>
                    You agree that the use of the foxCaves Network is entirely at your own risk. The foxCaves Network is
                    provided on an "as is" basis without warranties of any kind, either expressed or implied,
                    constructive, or statutory, including, without limitation, any implied warranties of
                    merchantability, non-infringement or fitness for a particular purpose.
                </p>
                <p>
                    foxCaves makes no guarantee of availability for the foxCaves Network and reserves the right to
                    change, withdraw, suspend or discontinue any feature at any time. In no event shall foxCaves be
                    liable for any damages, including, without limitation, direct, indirect, incidental, special,
                    consequential, or punitive damages arising out of the use of or inability to use the foxCaves
                    Network or any content thereon. This disclaimer applies, without limitation, to any damages or
                    injury, whether for breach of contract, tort, or otherwise, caused by any failure of performance;
                    error; omission; interruption; deletion; defect; delay in operation or transmission; computer virus;
                    file corruption; communication-line failure; network or system outage; or theft, destruction,
                    unauthorized access to, alteration of, or use of any record.
                </p>
            </section>
            <section id="indemnity">
                <div className="page-header">
                    <h2>4. Indemnity</h2>
                </div>
                <p>
                    You agree to indemnify and hold foxCaves harmless from any loss, liability, claims, damages and
                    expenses, including attorneys fees, arising from or related to the content, use, or deletion of your
                    content or use of any other feature or service.
                </p>
            </section>
            <section id="abuse">
                <div className="page-header">
                    <h2>5. Abuse</h2>
                </div>
                <p>
                    The following types of content are considered as "abuse" by foxCaves and may not be uploaded to the
                    foxCaves Network:
                </p>
                <ul>
                    <li>Content that is deemed illegal in the USA</li>
                    <li>Copyrighted content</li>
                    <li>Content that attacks or harasses any individual or group</li>
                    <li>Content used to promote, spam, or send unsolicited marketing messages</li>
                </ul>
                <p>
                    Uploading content that violates any of the above may result in your immediate termination of your
                    ability to use the foxCaves Network.
                </p>
                <p>
                    If you wish to report content that violates these terms, please report it to{' '}
                    <a href="mailto:foxcaves@doridian.net">foxcaves@doridian.net</a>
                </p>
            </section>
            <section id="misc">
                <div className="page-header">
                    <h2>6. Miscellaneous</h2>
                </div>
                <p>
                    foxCaves reserves the right to change this agreement at any time without prior notice. This
                    agreement was last updated 13th April 2025.
                </p>
            </section>
        </>
    );
};
