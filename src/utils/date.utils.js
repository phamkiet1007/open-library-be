const getVietnamTime = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return vietnamTime;
};

module.exports = { getVietnamTime };