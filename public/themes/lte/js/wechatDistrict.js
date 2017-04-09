define(['jquery'], function ($) {
  var districts = { "10": { "title": "\u56db\u5ddd", "cities": { "101": "\u51c9\u5c71", "102": "\u8d44\u9633", "103": "\u6210\u90fd", "104": "\u81ea\u8d21", "105": "\u6cf8\u5dde", "106": "\u6500\u679d\u82b1", "107": "\u7ef5\u9633", "108": "\u5fb7\u9633", "109": "\u9042\u5b81", "110": "\u5e7f\u5143", "111": "\u4e50\u5c71", "112": "\u5185\u6c5f", "113": "\u5357\u5145", "114": "\u5b9c\u5bbe", "115": "\u7709\u5c71", "116": "\u8fbe\u5dde", "117": "\u5e7f\u5b89", "118": "\u5df4\u4e2d", "119": "\u96c5\u5b89", "120": "\u7518\u5b5c", "121": "\u963f\u575d" } }, "20": { "title": "\u91cd\u5e86", "cities": { "201": "\u9149\u9633", "202": "\u5f6d\u6c34", "203": "\u5408\u5ddd", "204": "\u6c38\u5ddd", "205": "\u6c5f\u6d25", "206": "\u5357\u5ddd", "207": "\u94dc\u6881", "208": "\u5927\u8db3", "209": "\u8363\u660c", "210": "\u74a7\u5c71", "211": "\u957f\u5bff", "212": "\u7da6\u6c5f", "213": "\u6f7c\u5357", "214": "\u6881\u5e73", "215": "\u57ce\u53e3", "216": "\u77f3\u67f1", "217": "\u79c0\u5c71", "218": "\u4e07\u5dde", "219": "\u6e1d\u4e2d", "220": "\u6daa\u9675", "221": "\u6c5f\u5317", "222": "\u5927\u6e21\u53e3", "223": "\u4e5d\u9f99\u5761", "224": "\u6c99\u576a\u575d", "225": "\u5317\u789a", "226": "\u5357\u5cb8", "227": "\u9ed4\u6c5f", "228": "\u5deb\u6eaa", "229": "\u53cc\u6865", "230": "\u4e07\u76db", "231": "\u5df4\u5357", "232": "\u6e1d\u5317", "233": "\u5fe0\u53bf", "234": "\u6b66\u9686", "235": "\u57ab\u6c5f", "236": "\u4e30\u90fd", "237": "\u5deb\u5c71", "238": "\u5949\u8282", "239": "\u4e91\u9633", "240": "\u5f00\u53bf" } }, "30": { "title": "\u9655\u897f", "cities": { "301": "\u5546\u6d1b", "302": "\u897f\u5b89", "303": "\u5b9d\u9e21", "304": "\u94dc\u5ddd", "305": "\u6e2d\u5357", "306": "\u54b8\u9633", "307": "\u6c49\u4e2d", "308": "\u5ef6\u5b89", "309": "\u5b89\u5eb7", "310": "\u6986\u6797" } }, "40": { "title": "\u7518\u8083", "cities": { "401": "\u5b9a\u897f", "402": "\u5e86\u9633", "403": "\u9647\u5357", "404": "\u7518\u5357", "405": "\u4e34\u590f", "406": "\u5170\u5dde", "407": "\u91d1\u660c", "408": "\u5609\u5cea\u5173", "409": "\u5929\u6c34", "410": "\u767d\u94f6", "411": "\u5f20\u6396", "412": "\u6b66\u5a01", "413": "\u9152\u6cc9", "414": "\u5e73\u51c9" } }, "50": { "title": "\u9752\u6d77", "cities": { "501": "\u6d77\u5357", "502": "\u679c\u6d1b", "503": "\u7389\u6811", "504": "\u6d77\u4e1c", "505": "\u6d77\u5317", "506": "\u9ec4\u5357", "507": "\u6d77\u897f", "508": "\u897f\u5b81" } }, "60": { "title": "\u5b81\u590f", "cities": { "601": "\u94f6\u5ddd", "602": "\u5434\u5fe0", "603": "\u77f3\u5634\u5c71", "604": "\u4e2d\u536b", "605": "\u56fa\u539f" } }, "70": { "title": "\u4e91\u5357", "cities": { "701": "\u7ea2\u6cb3", "702": "\u6587\u5c71", "703": "\u695a\u96c4", "704": "\u6012\u6c5f", "705": "\u5fb7\u5b8f", "706": "\u897f\u53cc\u7248\u7eb3", "707": "\u5927\u7406", "708": "\u8fea\u5e86", "709": "\u6606\u660e", "710": "\u66f2\u9756", "711": "\u4fdd\u5c71", "712": "\u7389\u6eaa", "713": "\u4e3d\u6c5f", "714": "\u662d\u901a", "715": "\u4e34\u6ca7", "716": "\u666e\u6d31" } }, "80": { "title": "\u6fb3\u95e8", "cities": [] }, "90": { "title": "\u8d35\u5dde", "cities": { "901": "\u6bd5\u8282", "902": "\u9ed4\u4e1c\u5357", "903": "\u9ed4\u5357", "904": "\u94dc\u4ec1", "905": "\u9ed4\u897f\u5357", "906": "\u8d35\u9633", "907": "\u9075\u4e49", "908": "\u516d\u76d8\u6c34", "909": "\u5b89\u987a" } }, "100": { "title": "\u9999\u6e2f", "cities": [] }, "110": { "title": "\u8fbd\u5b81", "cities": { "1101": "\u76d8\u9526", "1102": "\u8fbd\u9633", "1103": "\u671d\u9633", "1104": "\u94c1\u5cad", "1105": "\u846b\u82a6\u5c9b", "1106": "\u6c88\u9633", "1107": "\u978d\u5c71", "1108": "\u5927\u8fde", "1109": "\u672c\u6eaa", "1110": "\u629a\u987a", "1111": "\u9526\u5dde", "1112": "\u4e39\u4e1c", "1113": "\u961c\u65b0", "1114": "\u8425\u53e3" } }, "120": { "title": "\u5409\u6797", "cities": { "1201": "\u5ef6\u8fb9", "1202": "\u957f\u6625", "1203": "\u56db\u5e73", "1204": "\u5409\u6797", "1205": "\u901a\u5316", "1206": "\u8fbd\u6e90", "1207": "\u677e\u539f", "1208": "\u767d\u5c71", "1209": "\u767d\u57ce" } }, "130": { "title": "\u9ed1\u9f99\u6c5f", "cities": { "1301": "\u9ed1\u6cb3", "1302": "\u7261\u4e39\u6c5f", "1303": "\u54c8\u5c14\u6ee8", "1304": "\u5927\u5174\u5b89\u5cad", "1305": "\u9e21\u897f", "1306": "\u9f50\u9f50\u54c8\u5c14", "1307": "\u53cc\u9e2d\u5c71", "1308": "\u9e64\u5c97", "1309": "\u4f0a\u6625", "1310": "\u5927\u5e86", "1311": "\u4e03\u53f0\u6cb3", "1312": "\u4f73\u6728\u65af" } }, "140": { "title": "\u6d77\u5357", "cities": { "1401": "\u4e50\u4e1c", "1402": "\u660c\u6c5f", "1403": "\u767d\u6c99", "1404": "\u897f\u6c99", "1405": "\u743c\u4e2d", "1406": "\u4fdd\u4ead", "1407": "\u9675\u6c34", "1408": "\u4e2d\u6c99", "1409": "\u5357\u6c99", "1410": "\u6d77\u53e3", "1411": "\u4e09\u4e9a", "1412": "\u4e94\u6307\u5c71", "1413": "\u510b\u5dde", "1414": "\u743c\u6d77", "1415": "\u6587\u660c", "1416": "\u4e1c\u65b9", "1417": "\u4e07\u5b81", "1418": "\u5b9a\u5b89", "1419": "\u5c6f\u660c", "1420": "\u6f84\u8fc8", "1421": "\u4e34\u9ad8" } }, "150": { "title": "\u5e7f\u4e1c", "cities": { "1501": "\u63ed\u9633", "1502": "\u4e2d\u5c71", "1503": "\u5e7f\u5dde", "1504": "\u6df1\u5733", "1505": "\u97f6\u5173", "1506": "\u6c55\u5934", "1507": "\u73e0\u6d77", "1508": "\u6c5f\u95e8", "1509": "\u4f5b\u5c71", "1510": "\u8302\u540d", "1511": "\u6e5b\u6c5f", "1512": "\u60e0\u5dde", "1513": "\u8087\u5e86", "1514": "\u6c55\u5c3e", "1515": "\u6885\u5dde", "1516": "\u9633\u6c5f", "1517": "\u6cb3\u6e90", "1518": "\u4e1c\u839e", "1519": "\u6e05\u8fdc", "1520": "\u6f6e\u5dde", "1521": "\u4e91\u6d6e" } }, "160": { "title": "\u5e7f\u897f", "cities": { "1601": "\u8d3a\u5dde", "1602": "\u767e\u8272", "1603": "\u6765\u5bbe", "1604": "\u6cb3\u6c60", "1605": "\u5d07\u5de6", "1606": "\u5357\u5b81", "1607": "\u6842\u6797", "1608": "\u67f3\u5dde", "1609": "\u5317\u6d77", "1610": "\u68a7\u5dde", "1611": "\u94a6\u5dde", "1612": "\u9632\u57ce\u6e2f", "1613": "\u7389\u6797", "1614": "\u8d35\u6e2f" } }, "170": { "title": "\u6e56\u5317", "cities": { "1701": "\u9ec4\u5188", "1702": "\u8346\u5dde", "1703": "\u968f\u5dde", "1704": "\u54b8\u5b81", "1705": "\u795e\u519c\u67b6", "1706": "\u6069\u65bd", "1707": "\u6b66\u6c49", "1708": "\u5341\u5830", "1709": "\u9ec4\u77f3", "1710": "\u5b9c\u660c", "1711": "\u9102\u5dde", "1712": "\u8944\u6a0a", "1713": "\u5b5d\u611f", "1714": "\u8346\u95e8", "1715": "\u6f5c\u6c5f", "1716": "\u4ed9\u6843", "1717": "\u5929\u95e8" } }, "180": { "title": "\u6e56\u5357", "cities": { "1801": "\u6c38\u5dde", "1802": "\u90f4\u5dde", "1803": "\u5a04\u5e95", "1804": "\u6000\u5316", "1805": "\u6e58\u897f", "1806": "\u957f\u6c99", "1807": "\u6e58\u6f6d", "1808": "\u682a\u6d32", "1809": "\u90b5\u9633", "1810": "\u8861\u9633", "1811": "\u5e38\u5fb7", "1812": "\u5cb3\u9633", "1813": "\u76ca\u9633", "1814": "\u5f20\u5bb6\u754c" } }, "190": { "title": "\u6cb3\u5357", "cities": { "1901": "\u6f2f\u6cb3", "1902": "\u8bb8\u660c", "1903": "\u5357\u9633", "1904": "\u4e09\u95e8\u5ce1", "1905": "\u4fe1\u9633", "1906": "\u5546\u4e18", "1907": "\u9a7b\u9a6c\u5e97", "1908": "\u5468\u53e3", "1909": "\u6d4e\u6e90", "1910": "\u90d1\u5dde", "1911": "\u6d1b\u9633", "1912": "\u5f00\u5c01", "1913": "\u5b89\u9633", "1914": "\u5e73\u9876\u5c71", "1915": "\u65b0\u4e61", "1916": "\u9e64\u58c1", "1917": "\u6fee\u9633", "1918": "\u7126\u4f5c" } }, "200": { "title": "\u53f0\u6e7e", "cities": { "2001": "\u5c4f\u4e1c\u53bf", "2002": "\u6f8e\u6e56\u53bf", "2003": "\u53f0\u4e1c\u53bf", "2004": "\u82b1\u83b2\u53bf", "2005": "\u53f0\u5317\u5e02", "2006": "\u57fa\u9686\u5e02", "2007": "\u9ad8\u96c4\u5e02", "2008": "\u53f0\u5357\u5e02", "2009": "\u53f0\u4e2d\u5e02", "2010": "\u5609\u4e49\u5e02", "2011": "\u65b0\u7af9\u5e02", "2012": "\u5b9c\u5170\u53bf", "2013": "\u53f0\u5317\u53bf", "2014": "\u65b0\u7af9\u53bf", "2015": "\u6843\u56ed\u53bf", "2016": "\u53f0\u4e2d\u53bf", "2017": "\u82d7\u6817\u53bf", "2018": "\u5357\u6295\u53bf", "2019": "\u5f70\u5316\u53bf", "2020": "\u5609\u4e49\u53bf", "2021": "\u4e91\u6797\u53bf", "2022": "\u9ad8\u96c4\u53bf", "2023": "\u53f0\u5357\u53bf" } }, "210": { "title": "\u5317\u4eac", "cities": { "2101": "\u623f\u5c71", "2102": "\u5927\u5174", "2103": "\u987a\u4e49", "2104": "\u901a\u5dde", "2105": "\u660c\u5e73", "2106": "\u5bc6\u4e91", "2107": "\u5e73\u8c37", "2108": "\u5ef6\u5e86", "2109": "\u4e1c\u57ce", "2110": "\u6000\u67d4", "2111": "\u5d07\u6587", "2112": "\u897f\u57ce", "2113": "\u671d\u9633", "2114": "\u5ba3\u6b66", "2115": "\u77f3\u666f\u5c71", "2116": "\u4e30\u53f0", "2117": "\u95e8\u5934\u6c9f", "2118": "\u6d77\u6dc0" } }, "220": { "title": "\u6cb3\u5317", "cities": { "2201": "\u8861\u6c34", "2202": "\u5eca\u574a", "2203": "\u77f3\u5bb6\u5e84", "2204": "\u79e6\u7687\u5c9b", "2205": "\u5510\u5c71", "2206": "\u90a2\u53f0", "2207": "\u90af\u90f8", "2208": "\u5f20\u5bb6\u53e3", "2209": "\u4fdd\u5b9a", "2210": "\u6ca7\u5dde", "2211": "\u627f\u5fb7" } }, "230": { "title": "\u5929\u6d25", "cities": { "2301": "\u897f\u9752", "2302": "\u4e1c\u4e3d", "2303": "\u5317\u8fb0", "2304": "\u6d25\u5357", "2305": "\u5b81\u6cb3", "2306": "\u6b66\u6e05", "2307": "\u9759\u6d77", "2308": "\u5b9d\u577b", "2309": "\u548c\u5e73", "2310": "\u6cb3\u897f", "2311": "\u6cb3\u4e1c", "2312": "\u6cb3\u5317", "2313": "\u5357\u5f00", "2314": "\u5858\u6cbd", "2315": "\u7ea2\u6865", "2316": "\u5927\u6e2f", "2317": "\u6c49\u6cbd", "2318": "\u84df\u53bf" } }, "240": { "title": "\u5185\u8499\u53e4", "cities": { "2401": "\u9521\u6797\u90ed\u52d2", "2402": "\u5174\u5b89", "2403": "\u963f\u62c9\u5584", "2404": "\u547c\u548c\u6d69\u7279", "2405": "\u4e4c\u6d77", "2406": "\u5305\u5934", "2407": "\u901a\u8fbd", "2408": "\u8d64\u5cf0", "2409": "\u547c\u4f26\u8d1d\u5c14", "2410": "\u9102\u5c14\u591a\u65af", "2411": "\u4e4c\u5170\u5bdf\u5e03", "2412": "\u5df4\u5f66\u6dd6\u5c14" } }, "250": { "title": "\u5c71\u897f", "cities": { "2501": "\u5415\u6881", "2502": "\u4e34\u6c7e", "2503": "\u592a\u539f", "2504": "\u9633\u6cc9", "2505": "\u5927\u540c", "2506": "\u664b\u57ce", "2507": "\u957f\u6cbb", "2508": "\u664b\u4e2d", "2509": "\u6714\u5dde", "2510": "\u5ffb\u5dde", "2511": "\u8fd0\u57ce" } }, "260": { "title": "\u6d59\u6c5f", "cities": { "2601": "\u4e3d\u6c34", "2602": "\u53f0\u5dde", "2603": "\u676d\u5dde", "2604": "\u6e29\u5dde", "2605": "\u5b81\u6ce2", "2606": "\u6e56\u5dde", "2607": "\u5609\u5174", "2608": "\u91d1\u534e", "2609": "\u7ecd\u5174", "2610": "\u821f\u5c71", "2611": "\u8862\u5dde" } }, "270": { "title": "\u6c5f\u82cf", "cities": { "2701": "\u9547\u6c5f", "2702": "\u626c\u5dde", "2703": "\u5bbf\u8fc1", "2704": "\u6cf0\u5dde", "2705": "\u5357\u4eac", "2706": "\u5f90\u5dde", "2707": "\u65e0\u9521", "2708": "\u82cf\u5dde", "2709": "\u5e38\u5dde", "2710": "\u8fde\u4e91\u6e2f", "2711": "\u5357\u901a", "2712": "\u76d0\u57ce", "2713": "\u6dee\u5b89" } }, "280": { "title": "\u4e0a\u6d77", "cities": { "2801": "\u6768\u6d66", "2802": "\u5357\u6c47", "2803": "\u5b9d\u5c71", "2804": "\u95f5\u884c", "2805": "\u6d66\u4e1c\u65b0", "2806": "\u5609\u5b9a", "2807": "\u677e\u6c5f", "2808": "\u91d1\u5c71", "2809": "\u5d07\u660e", "2810": "\u5949\u8d24", "2811": "\u9752\u6d66", "2812": "\u9ec4\u6d66", "2813": "\u5362\u6e7e", "2814": "\u957f\u5b81", "2815": "\u5f90\u6c47", "2816": "\u666e\u9640", "2817": "\u9759\u5b89", "2818": "\u8679\u53e3", "2819": "\u95f8\u5317" } }, "290": { "title": "\u5c71\u4e1c", "cities": { "2901": "\u65e5\u7167", "2902": "\u5a01\u6d77", "2903": "\u4e34\u6c82", "2904": "\u83b1\u829c", "2905": "\u804a\u57ce", "2906": "\u5fb7\u5dde", "2907": "\u83cf\u6cfd", "2908": "\u6ee8\u5dde", "2909": "\u6d4e\u5357", "2910": "\u6dc4\u535a", "2911": "\u9752\u5c9b", "2912": "\u4e1c\u8425", "2913": "\u67a3\u5e84", "2914": "\u6f4d\u574a", "2915": "\u70df\u53f0", "2916": "\u6cf0\u5b89", "2917": "\u6d4e\u5b81" } }, "300": { "title": "\u6c5f\u897f", "cities": { "3001": "\u4e0a\u9976", "3002": "\u629a\u5dde", "3003": "\u5357\u660c", "3004": "\u840d\u4e61", "3005": "\u666f\u5fb7\u9547", "3006": "\u65b0\u4f59", "3007": "\u4e5d\u6c5f", "3008": "\u8d63\u5dde", "3009": "\u9e70\u6f6d", "3010": "\u5b9c\u6625", "3011": "\u5409\u5b89" } }, "310": { "title": "\u798f\u5efa", "cities": { "3101": "\u798f\u5dde", "3102": "\u8386\u7530", "3103": "\u53a6\u95e8", "3104": "\u6cc9\u5dde", "3105": "\u4e09\u660e", "3106": "\u5357\u5e73", "3107": "\u6f33\u5dde", "3108": "\u5b81\u5fb7", "3109": "\u9f99\u5ca9" } }, "320": { "title": "\u5b89\u5fbd", "cities": { "3201": "\u6ec1\u5dde", "3202": "\u9ec4\u5c71", "3203": "\u5bbf\u5dde", "3204": "\u961c\u9633", "3205": "\u516d\u5b89", "3206": "\u5de2\u6e56", "3207": "\u6c60\u5dde", "3208": "\u4eb3\u5dde", "3209": "\u5ba3\u57ce", "3210": "\u5408\u80a5", "3211": "\u868c\u57e0", "3212": "\u829c\u6e56", "3213": "\u9a6c\u978d\u5c71", "3214": "\u6dee\u5357", "3215": "\u94dc\u9675", "3216": "\u6dee\u5317", "3217": "\u5b89\u5e86" } }, "330": { "title": "\u897f\u85cf", "cities": { "3301": "\u90a3\u66f2", "3302": "\u963f\u91cc", "3303": "\u6797\u829d", "3304": "\u660c\u90fd", "3305": "\u5c71\u5357", "3306": "\u65e5\u5580\u5219", "3307": "\u62c9\u8428" } }, "340": { "title": "\u65b0\u7586", "cities": { "3401": "\u535a\u5c14\u5854\u62c9", "3402": "\u5410\u9c81\u756a", "3403": "\u54c8\u5bc6", "3404": "\u660c\u5409", "3405": "\u548c\u7530", "3406": "\u5580\u4ec0", "3407": "\u514b\u5b5c\u52d2\u82cf", "3408": "\u5df4\u97f3\u90ed\u695e", "3409": "\u963f\u514b\u82cf", "3410": "\u4f0a\u7281", "3411": "\u5854\u57ce", "3412": "\u4e4c\u9c81\u6728\u9f50", "3413": "\u963f\u52d2\u6cf0", "3414": "\u514b\u62c9\u739b\u4f9d", "3415": "\u77f3\u6cb3\u5b50", "3416": "\u56fe\u6728\u8212\u514b", "3417": "\u963f\u62c9\u5c14", "3418": "\u4e94\u5bb6\u6e20" } } };
  var mod = {};

  function renderCity(elms, vals, opts) {
    if (!elms.city) {
      return false;
    }
    elms.city.options.length = 0;
    if (opts.withTitle) {
      elms.city.options.add(new Option('市', ''));
    }
    var opt = elms.province.options[elms.province.options.selectedIndex];
    var pid = $(opt).attr('pid');
    if (pid) {
      $.each(districts[pid].cities, function (i, val) {
        var opt = new Option(val, val);
        $(opt).attr('cid', i);
        elms.city.options.add(opt);
      });
    }
    if (vals.city) {
      $(elms.city).val(vals.city);
    }
  }
  mod.render = function (elms, vals, opts) {
    if (!elms.province) {
      return false;
    }
    elms.province.options.length = 0;
    if (opts.withTitle) {
      elms.province.options.add(new Option('省/直辖市', ''));
    }
    $.each(districts, function (i, val) {
      var opt = new Option(val.title, val.title);
      $(opt).attr('pid', i);
      elms.province.options.add(opt);
    });
    if (vals.province) {
      $(elms.province).val(vals.province);
    }
    if (elms.city) {
      $(elms.province).on('change', function () {
        renderCity(elms, vals, opts);
      });
      $(elms.province).trigger('change');
    }
  };
  return mod;
});
