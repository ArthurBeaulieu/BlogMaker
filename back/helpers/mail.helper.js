/* This helper is made to format mail as HTML */


exports.activationLinkMail = opts => {
  return `
    <h3>Welcome to ${process.env.APP_NAME}, ${opts.user.username}!</h3>
    <p>You're almost done with the registration process for ${process.env.APP_NAME}.</p>
    <p>All you need to do now is to click on the following link to activate your account:</p>
    <a href="${opts.url}"><b><i>Activate my account!</i></b></a>
    <p>That's all, thank you for your registration to ${process.env.APP_NAME}. See you soon!</p>
    <p style="margin-top:12px"><i>If you haven't made a registration on this website, please ignore this email</i></p>
  `;
};
