import $ from './helpers/jquery';

/**
 * Applies available Lolflavor options to UI
 */
function lolflavor() {
  if ($('#options_sr_source').val() !== 'lolflavor') {
    $('#options_sr_source').val('lolflavor');
    $('#sr_source_text').text($('.rift_source').find('[data-value="lolflavor"]').text());
    $('.rift_source').find('[data-value="championgg"]').attr('class', 'item');
    $('.rift_source').find('[data-value="lolflavor"]').addClass('selected active');
  }
  $('#options_splititems').parent().addClass('disabled');
  $('#options_splititems').attr('disabled', 'disabled');
  $('#options_skillsformat').parent().addClass('disabled');
  $('#options_skillsformat').attr('disabled', 'disabled');
}

/**
 * Applies available Championgg options to UI
 */
function championgg() {
  $('#options_splititems').parent().removeClass('disabled');
  $('#options_splititems').removeAttr('disabled', 'disabled');
  $('#options_skillsformat').parent().removeClass('disabled');
  $('#options_skillsformat').removeAttr('disabled', 'disabled');
}

export default {
  championgg,
  lolflavor
};
