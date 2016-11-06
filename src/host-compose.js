
module.exports = (cfg) =>
{
	var host = cfg.host

	if (cfg.port_nginx !== 80)
	{
		host = host + ':' + cfg.port_nginx
	}

	return host
}
